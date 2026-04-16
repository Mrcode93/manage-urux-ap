import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  Search,
  Filter,
  FileCode,
  FileImage,
  FileType,
  MoreVertical,
  ExternalLink,
  Loader2,
  Clock,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  getPublicFiles,
  uploadPublicFile,
  deletePublicFile,
  type PublicFile
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const PublicFiles: React.FC = () => {
  const [files, setFiles] = useState<PublicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'other',
    description: '',
    file: null as File | null
  });

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await getPublicFiles();
      setFiles(data);
    } catch (error) {
      toast.error('فشل في تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('يرجى اختيار ملف');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('name', uploadForm.name || uploadForm.file.name);
    formData.append('category', uploadForm.category);
    formData.append('description', uploadForm.description);

    try {
      setUploading(true);
      await uploadPublicFile(formData);
      toast.success('تم رفع الملف بنجاح');
      setShowUploadModal(false);
      setUploadForm({ name: '', category: 'other', description: '', file: null });
      fetchFiles();
    } catch (error) {
      toast.error('فشل في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    try {
      await deletePublicFile(id);
      toast.success('تم حذف الملف');
      setFiles(files.filter(f => f._id !== id));
    } catch (error) {
      toast.error('فشل في حذف الملف');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="text-pink-500" />;
    if (type.includes('pdf')) return <FileText className="text-red-500" />;
    if (type.includes('json') || type.includes('javascript') || type.includes('html')) return <FileCode className="text-blue-500" />;
    return <FileType className="text-slate-400" />;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || file.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black dark:text-white flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            إدارة الملفات العامة
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            ارفع وادر الملفات التي تظهر للمستخدمين في صفحة التنزيلات
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          رفع ملف جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">إجمالي الملفات</p>
          <h3 className="text-2xl font-black dark:text-white">{files.length}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">إجمالي التنزيلات</p>
          <h3 className="text-2xl font-black dark:text-white">
            {files.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0)}
          </h3>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-3xl backdrop-blur-xl border border-white/20">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="بحث عن ملف باسمه أو وصفه..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex bg-white dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
          {['all', 'document', 'image', 'pdf'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filterCategory === cat
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              {cat === 'all' ? 'الكل' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 overflow-hidden shadow-2xl shadow-indigo-500/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/2">
                <th className="px-8 py-6 font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-white/5">الملف</th>
                <th className="px-8 py-6 font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-white/5">التصنيف</th>
                <th className="px-8 py-6 font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-white/5">الحجم</th>
                <th className="px-8 py-6 font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-white/5">التنزيلات</th>
                <th className="px-8 py-6 font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-white/5">التاريخ</th>
                <th className="px-8 py-6 font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-white/5">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-bold">جاري تحميل الملفات...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                          <Plus className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-lg font-bold text-slate-500">لا توجد ملفات حالياً</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => (
                    <motion.tr
                      key={file._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <p className="font-black dark:text-white mb-1">{file.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{file.description || 'لا يوجد وصف'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                          {file.category}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{formatSize(file.size)}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Download className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-black dark:text-white">{file.downloadCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold dark:text-white">{new Date(file.createdAt).toLocaleDateString('ar-EG')}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{new Date(file.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:scale-110 transition-all border border-blue-100/50 dark:border-blue-500/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:scale-110 transition-all border border-red-100/50 dark:border-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black dark:text-white flex items-center gap-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                    رفع ملف جديد
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Plus className="h-6 w-6 rotate-45 dark:text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">اسم الملف</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white font-bold"
                    placeholder="سيظهر هذا الاسم للمستخدمين"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">التصنيف</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white font-bold appearance-none cursor-pointer"
                    >
                      <option value="document">مستند (Document)</option>
                      <option value="image">صورة (Image)</option>
                      <option value="pdf">ملف PDF</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">الملف</label>
                    <div className="relative h-[60px]">
                      <input
                        type="file"
                        required
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files ? e.target.files[0] : null })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="absolute inset-0 px-5 flex items-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 group-hover:border-blue-500 transition-colors">
                        <Plus className="h-5 w-5 text-slate-400 ml-3" />
                        <span className="text-sm font-bold text-slate-500 truncate">
                          {uploadForm.file ? uploadForm.file.name : 'اختر ملفاً...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">وصف الملف</label>
                  <textarea
                    rows={3}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white font-bold resize-none"
                    placeholder="اكتب وصفاً مختصراً عما يحتوي عليه هذا الملف..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
                      تأكيد الرفع
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicFiles;
