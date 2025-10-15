import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import type { ExpenseSection } from '../api/client';
import { addExpenseSection, updateExpenseSection, removeExpenseSection } from '../api/client';
import Button from './Button';

interface ExpenseSectionsManagerProps {
  saleId: string;
  expenses: ExpenseSection[] | Omit<ExpenseSection, '_id'>[];
  currency: string;
  onExpensesUpdate: (expenses: ExpenseSection[] | Omit<ExpenseSection, '_id'>[]) => void;
  isStandalone?: boolean;
}

interface ExpenseFormData {
  name: string;
  amount: number;
  description: string;
  category: 'marketing' | 'development' | 'server_costs' | 'support' | 'other';
}

const ExpenseSectionsManager: React.FC<ExpenseSectionsManagerProps> = ({
  saleId,
  expenses,
  currency,
  onExpensesUpdate,
  isStandalone = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseSection | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    amount: 0,
    description: '',
    category: 'other'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      description: '',
      category: 'other'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isStandalone) {
      // Handle standalone mode - manage expenses locally
      const newExpense: ExpenseSection = {
        _id: `temp_${Date.now()}`,
        name: formData.name,
        amount: formData.amount,
        description: formData.description,
        category: formData.category
      };

      if (editingExpense) {
        // Update existing expense
        const updatedExpenses = expenses.map(expense => 
          expense._id === editingExpense._id 
            ? { ...expense, ...formData }
            : expense
        );
        onExpensesUpdate(updatedExpenses);
        toast.success('تم تحديث قسم المصروفات بنجاح');
        setEditingExpense(null);
      } else {
        // Add new expense
        const updatedExpenses = [...expenses, newExpense];
        onExpensesUpdate(updatedExpenses);
        toast.success('تم إضافة قسم المصروفات بنجاح');
        setIsAdding(false);
      }
      resetForm();
    } else {
      // Handle normal mode with API calls
      try {
        if (editingExpense) {
          // Update existing expense
          const updatedSale = await updateExpenseSection(saleId, editingExpense._id, formData);
          onExpensesUpdate(updatedSale.expenses.sections);
          toast.success('تم تحديث قسم المصروفات بنجاح');
          setEditingExpense(null);
        } else {
          // Add new expense
          const updatedSale = await addExpenseSection(saleId, formData);
          onExpensesUpdate(updatedSale.expenses.sections);
          toast.success('تم إضافة قسم المصروفات بنجاح');
          setIsAdding(false);
        }
        resetForm();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'فشل في حفظ قسم المصروفات');
      }
    }
  };

  const handleEdit = (expense: ExpenseSection) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount,
      description: expense.description || '',
      category: expense.category
    });
    setIsAdding(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('هل أنت متأكد من حذف قسم المصروفات هذا؟')) {
      if (isStandalone) {
        // Handle standalone mode - remove expense locally
        const updatedExpenses = expenses.filter(expense => expense._id !== expenseId);
        onExpensesUpdate(updatedExpenses);
        toast.success('تم حذف قسم المصروفات بنجاح');
      } else {
        // Handle normal mode with API calls
        try {
          const updatedSale = await removeExpenseSection(saleId, expenseId);
          onExpensesUpdate(updatedSale.expenses.sections);
          toast.success('تم حذف قسم المصروفات بنجاح');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'فشل في حذف قسم المصروفات');
        }
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'marketing':
        return <TagIcon className="w-4 h-4" />;
      case 'development':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'server_costs':
        return <BanknotesIcon className="w-4 h-4" />;
      case 'support':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return <BanknotesIcon className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    const categoryNames = {
      marketing: 'التسويق',
      development: 'التطوير',
      server_costs: 'تكاليف الخادم',
      support: 'الدعم',
      other: 'أخرى'
    };
    return categoryNames[category as keyof typeof categoryNames] || 'أخرى';
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">أقسام المصروفات</h3>
        <Button
          onClick={() => {
            setIsAdding(true);
            setEditingExpense(null);
            resetForm();
          }}
          size="sm"
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          إضافة مصروف
        </Button>
      </div>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{expense.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <TagIcon className="w-3 h-3 mr-1" />
                        {getCategoryName(expense.category)}
                      </span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {expense.amount.toFixed(2)} {currency}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{expense.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="p-1 text-yellow-600 hover:text-yellow-800"
                    title="تعديل"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="حذف"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Total Expenses */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-900 dark:text-red-100">إجمالي المصروفات:</span>
              <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                {totalExpenses.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BanknotesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>لا توجد مصروفات مضافة</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingExpense ? 'تعديل قسم المصروفات' : 'إضافة قسم مصروفات جديد'}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم المصروف *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="مثال: إعلانات جوجل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المبلغ *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الفئة
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="marketing">التسويق</option>
                  <option value="development">التطوير</option>
                  <option value="server_costs">تكاليف الخادم</option>
                  <option value="support">الدعم</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="وصف تفصيلي للمصروف..."
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAdding(false);
                  setEditingExpense(null);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {editingExpense ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExpenseSectionsManager;
