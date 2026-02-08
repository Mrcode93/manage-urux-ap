import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ProfileWriteGuard } from "../components/PermissionGuard";
import Button from "../components/Button";
import Loader from "../components/Loader";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  Shield,
  Calendar,
  Edit3,
  CheckCircle,
  AlertCircle,
  Settings,
  Key,
  UserCheck,
} from "lucide-react";

const Profile: React.FC = () => {
  const { admin, updateProfile, isLoading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: admin?.username || "",
    name: admin?.name || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "اسم المستخدم مطلوب";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = "اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط";
    }

    if (!formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "الاسم يجب أن يكون حرفين على الأقل";
    }

    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "كلمة المرور الحالية مطلوبة";
      }
      if (!formData.newPassword) {
        newErrors.newPassword = "كلمة المرور الجديدة مطلوبة";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
        newErrors.newPassword = "كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "كلمة المرور غير متطابقة";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    if (!validateForm()) return;

    const updateData: any = {};
    if (formData.username.trim() !== admin?.username) updateData.username = formData.username.trim();
    if (formData.name.trim() !== admin?.name) updateData.name = formData.name.trim();

    if (formData.currentPassword && formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false);
      return;
    }

    const success = await updateProfile(updateData);
    if (success) {
      setIsEditing(false);
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});

      const updatedFields = [];
      if (updateData.username) updatedFields.push("اسم المستخدم");
      if (updateData.name) updatedFields.push("الاسم");
      if (updateData.newPassword) updatedFields.push("كلمة المرور");

      const message = updatedFields.length > 0
        ? `تم تحديث ${updatedFields.join(" و ")} بنجاح. سيتم تسجيل الخروج تلقائياً للأمان`
        : "تم تحديث الملف الشخصي بنجاح. سيتم تسجيل الخروج تلقائياً للأمان";

      setSuccessMessage(message);

      // Auto logout after profile update for security
      setTimeout(() => {
        setSuccessMessage("");
        logout();
      }, 2000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: admin?.username || "",
      name: admin?.name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setSuccessMessage("");
  };

  if (!admin) {
    return <Loader message="جاري تحميل بيانات الملف الشخصي..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الملف الشخصي
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة بيانات الحساب والإعدادات الشخصية
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Overview Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                معلومات الحساب
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <input
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      disabled={!isEditing}
                      className={`w-full rounded-xl border px-4 py-3 transition-all duration-200 font-mono ${!isEditing
                        ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                        : "bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        }`}
                      placeholder="أدخل اسم المستخدم"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {errors.username && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.username}
                    </p>
                  )}
                  {!isEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">انقر على تعديل لتغيير اسم المستخدم</p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditing}
                    className={`w-full rounded-xl border px-4 py-3 transition-all duration-200 ${!isEditing
                      ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                      : "bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      }`}
                    placeholder="أدخل اسمك الكامل"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    الدور
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-600 dark:text-gray-300">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium capitalize">{admin.role.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Created At */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    تاريخ الإنشاء
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    {new Date(admin.createdAt).toLocaleDateString("ar-IQ", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          {isEditing && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  تغيير كلمة المرور
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["current", "new", "confirm"].map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {field === "current"
                          ? "كلمة المرور الحالية"
                          : field === "new"
                            ? "كلمة المرور الجديدة"
                            : "تأكيد كلمة المرور"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords[field as keyof typeof showPasswords] ? "text" : "password"}
                          value={formData[`${field}Password` as keyof typeof formData] as string}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [`${field}Password`]: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 pr-12 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder={field === "current" ? "أدخل كلمة المرور الحالية" : field === "new" ? "أدخل كلمة المرور الجديدة" : "أعد إدخال كلمة المرور الجديدة"}
                        />
                        <button
                          type="button"
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          onClick={() =>
                            setShowPasswords((prev: { current: boolean; new: boolean; confirm: boolean }) => ({
                              ...prev,
                              [field]: !prev[field as keyof typeof prev],
                            }))
                          }
                        >
                          {showPasswords[field as keyof typeof showPasswords] ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errors[`${field}Password`] && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors[`${field}Password`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">متطلبات كلمة المرور:</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• يجب أن تكون 6 أحرف على الأقل</li>
                    <li>• يجب أن تحتوي على حرف كبير وحرف صغير</li>
                    <li>• يجب أن تحتوي على رقم واحد على الأقل</li>
                  </ul>
                </div>

                {/* Security Notice */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    ملاحظة أمنية
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    بعد تحديث البيانات الشخصية، سيتم تسجيل الخروج تلقائياً من جميع الأجهزة للأمان.
                  </p>
                </div>

                {/* Username Requirements */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">متطلبات اسم المستخدم:</h3>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• يجب أن يكون 3 أحرف على الأقل</li>
                    <li>• يمكن استخدام الأحرف والأرقام والشرطة السفلية فقط</li>
                    <li>• يجب أن يكون فريداً وغير مستخدم من قبل</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <ProfileWriteGuard
            fallback={
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  صلاحيات محدودة
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  ليس لديك صلاحية لتعديل الملف الشخصي
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">اتصل بالمدير للحصول على الصلاحيات</span>
                </div>
              </div>
            }
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                {!isEditing ? (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل الملف الشخصي
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                      className="px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                          جاري الحفظ...
                        </span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </ProfileWriteGuard>
        </form>
      </div>
    </div>
  );
};

export default Profile;
