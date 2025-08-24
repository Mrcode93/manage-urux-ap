import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ActivationCode, Feature } from '../api/client';

export interface ExportOptions {
    format: 'pdf' | 'excel';
    includeSelectedOnly?: boolean;
    selectedCodes?: string[];
    allCodes?: ActivationCode[];
    availableFeatures?: Feature[];
}

export const exportActivationCodes = async (options: ExportOptions) => {
    const { format, includeSelectedOnly, selectedCodes, allCodes, availableFeatures } = options;
    
    if (!allCodes || allCodes.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
    }

    // Filter codes based on selection
    const codesToExport = includeSelectedOnly && selectedCodes 
        ? allCodes.filter(code => selectedCodes.includes(code._id || code.code))
        : allCodes;

    if (codesToExport.length === 0) {
        throw new Error('لا توجد رموز محددة للتصدير');
    }

    // Helper function to get feature name
    const getFeatureName = (featureId: string) => {
        const feature = availableFeatures?.find(f => f.name === featureId);
        return feature ? `${feature.name} - ${feature.description}` : featureId;
    };

    // Helper function to get type label
    const getTypeLabel = (type: string) => {
        const typeLabels = {
            trial: 'تجريبي',
            full: 'كامل',
            partial: 'جزئي',
            features: 'ميزات محددة',
            custom: 'مخصص'
        };
        return typeLabels[type as keyof typeof typeLabels] || type;
    };

    // Helper function to get status
    const getStatus = (code: ActivationCode) => {
        const isExpired = code.expires_at && new Date() > new Date(code.expires_at);
        const isUsed = code.used;
        const isMaxUsed = (code.current_uses || 0) >= (code.max_uses || 1);
        
        if (isExpired) return 'منتهي الصلاحية';
        if (isUsed || isMaxUsed) return 'مستنفد';
        return 'متاح';
    };

    // Helper function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-IQ');
    };

    // Helper function to format expiration
    const formatExpiration = (expiresAt: string | undefined | null) => {
        if (!expiresAt) return 'دائم';
        
        const date = new Date(expiresAt);
        const isExpired = date < new Date();
        const daysLeft = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (isExpired) {
            return `منتهي منذ ${Math.abs(daysLeft)} يوم`;
        } else if (daysLeft === 0) {
            return 'ينتهي اليوم';
        } else if (daysLeft === 1) {
            return 'يوم واحد متبقي';
        } else if (daysLeft <= 30) {
            return `${daysLeft} يوم متبقي`;
        } else if (daysLeft <= 365) {
            return `${daysLeft} يوم (${Math.round(daysLeft / 30)} شهر)`;
        } else {
            return `${Math.round(daysLeft / 365)} سنة (${daysLeft} يوم)`;
        }
    };

    if (format === 'pdf') {
        return exportToPDF(codesToExport, getFeatureName, getTypeLabel, getStatus, formatDate, formatExpiration, availableFeatures);
    } else {
        return exportToExcel(codesToExport, getFeatureName, getTypeLabel, getStatus, formatDate, formatExpiration);
    }
};

// Helper function to get English equivalents for better PDF compatibility
function getEnglishLabel(arabicText: string): string {
    const translations: { [key: string]: string } = {
        'تقرير رموز التفعيل': 'Activation Codes Report',
        'تاريخ التصدير': 'Export Date',
        'إجمالي الرموز': 'Total Codes',
        'الرمز': 'Code',
        'النوع': 'Type',
        'الميزات': 'Features',
        'الاستخدامات': 'Usage',
        'تاريخ الانتهاء': 'Expiry Date',
        'تاريخ الإنشاء': 'Creation Date',
        'الحالة': 'Status',
        'تجريبي': 'Trial',
        'كامل': 'Full',
        'جزئي': 'Partial',
        'ميزات محددة': 'Custom Features',
        'مخصص': 'Custom',
        'متاح': 'Available',
        'مستنفد': 'Exhausted',
        'منتهي الصلاحية': 'Expired',
        'دائم': 'Permanent',
        'ينتهي اليوم': 'Expires Today',
        'يوم واحد متبقي': '1 Day Left',
        'يوم متبقي': 'Days Left',
        'شهر': 'Month',
        'سنة': 'Year',
        'صفحة': 'Page',
        'من': 'of'
    };
    
    return translations[arabicText] || arabicText;
}

// Helper function to translate feature names to English
function translateFeatureName(featureName: string): string {
    const featureTranslations: { [key: string]: string } = {
        'first_activation': 'First Activation',
        'pos': 'Point of Sale',
        'purchases': 'Purchases',
        'sales': 'Sales',
        'inventory': 'Inventory',
        'advanced_inventory': 'Advanced Inventory',
        'loyalty': 'Loyalty',
        'analytics': 'Analytics',
        'suppliers': 'Suppliers',
        'customers': 'Customers',
        'expenses': 'Expenses',
        'backup': 'Backup',
        'installments': 'Installments',
        'debts': 'Debts',
        'reports': 'Reports',
        'cloud-backup': 'Cloud Backup',
        'accounting': 'Accounting',
        'staff_management': 'Staff Management',
        'multi_store': 'Multi Store',
        'customer': 'Customer',
        'customer - customer': 'Customer Management',
        'suppliers - الموردين - إدارة الموردين': 'Suppliers Management',
        'cloud-backup - النسخ الاحتياطي السحابي - النسخ الاحتياطي': 'Cloud Backup',
        'expenses - المصروفات - إدارة المصروفات': 'Expenses Management',
        'installments - الأقساط - إدارة الأقساط': 'Installments Management',
        'backup - backup': 'Backup System',
        'reports - Reports': 'Reports System',
        'debts - Debts': 'Debts Management',
        'installments - Installments': 'Installments System',
        'customers - العملاء - إدارة العملاء': 'Customers System',
        'purchases - المشتريات - إدارة المشتريات': 'Purchases Management',
        'sales - المبيعات - إدارة المبيعات': 'Sales Management',
        'inventory - المخزون - إدارة المخزون': 'Inventory Management',
        'advanced_inventory - إدارة المخزون المتقدمة - إدارة المخزون المتقدمة': 'Advanced Inventory Management',
        'loyalty - الولاء': 'Loyalty System',
        'analytics - التحليلات - تحليلات متقدمة': 'Advanced Analytics',
        'accounting - المحاسبة - إدارة المحاسبة': 'Accounting Management',
        'staff_management - إدارة الموظفين': 'Staff Management',
        'multi_store - إدارة متعددة المتاجر': 'Multi Store Management'
    };
    
    return featureTranslations[featureName] || featureName;
}

// Helper function to clean and translate feature descriptions
function cleanFeatureDescription(description: string): string {
    // Remove Arabic text and keep only English parts
    const englishParts = description.split(' - ').filter(part => {
        // Check if part contains Arabic characters
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return !arabicRegex.test(part);
    });
    
    return englishParts.join(' - ') || description;
}

const exportToPDF = (
    codes: ActivationCode[],
    getFeatureName: (featureId: string) => string,
    getTypeLabel: (type: string) => string,
    getStatus: (code: ActivationCode) => string,
    formatDate: (dateString: string) => string,
    formatExpiration: (expiresAt: string | undefined | null) => string,
    availableFeatures?: Feature[]
) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Use English labels for PDF to avoid encoding issues
    doc.setFont('helvetica');
    doc.setFontSize(18);
    
    const title = 'Activation Codes Report';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (doc.internal.pageSize.width - titleWidth) / 2, 20);
    
    doc.setFontSize(12);
    const exportDate = `Export Date: ${new Date().toLocaleDateString('en-US')}`;
    const totalCodes = `Total Codes: ${codes.length}`;
    
    doc.text(exportDate, 20, 30);
    doc.text(totalCodes, 20, 40);

    // Prepare table data with English labels and cleaned feature names
    const tableData = codes.map(code => {
        // Clean and translate feature names for PDF
        const cleanedFeatures = code.features.map(f => {
            const featureName = translateFeatureName(f);
            const feature = availableFeatures?.find((feat: Feature) => feat.name === f);
            if (feature) {
                const cleanDescription = cleanFeatureDescription(feature.description);
                return `${featureName} - ${cleanDescription}`;
            }
            return featureName;
        });
        
        return [
            code.code,
            getEnglishLabel(getTypeLabel(code.type)),
            cleanedFeatures.join(', '),
            `${code.current_uses || 0}/${code.max_uses || 1}`,
            getEnglishLabel(formatExpiration(code.expires_at)),
            formatDate(code.created_at),
            getEnglishLabel(getStatus(code))
        ];
    });

    autoTable(doc, {
        head: [[
            'Code',
            'Type',
            'Features',
            'Usage',
            'Expiry Date',
            'Creation Date',
            'Status'
        ]],
        body: tableData,
        startY: 50,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left',
        },
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 20 },
            2: { cellWidth: 50 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 20 },
        },
        didDrawPage: function (data) {
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(10);
            const pageText = `Page ${data.pageNumber} of ${pageCount}`;
            doc.text(pageText, 140, 200, { align: 'center' });
        },
        didParseCell: function (data) {
            data.cell.styles.halign = 'left';
        }
    });

    const fileName = `activation-codes-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

const exportToExcel = (
    codes: ActivationCode[],
    getFeatureName: (featureId: string) => string,
    getTypeLabel: (type: string) => string,
    getStatus: (code: ActivationCode) => string,
    formatDate: (dateString: string) => string,
    formatExpiration: (expiresAt: string | undefined | null) => string
) => {
    // Prepare worksheet data with Arabic text (Excel handles Arabic better)
    const worksheetData = codes.map(code => ({
        'الرمز': code.code,
        'النوع': getTypeLabel(code.type),
        'الميزات': code.features.map(f => getFeatureName(f)).join(', '),
        'الاستخدامات الحالية': code.current_uses || 0,
        'الاستخدامات القصوى': code.max_uses || 1,
        'نسبة الاستخدام': `${Math.round(((code.current_uses || 0) / (code.max_uses || 1)) * 100)}%`,
        'تاريخ الانتهاء': formatExpiration(code.expires_at),
        'تاريخ الإنشاء': formatDate(code.created_at),
        'الحالة': getStatus(code),
        'مستخدم': code.used ? 'نعم' : 'لا',
        'منتهي الصلاحية': code.expires_at && new Date() > new Date(code.expires_at) ? 'نعم' : 'لا'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = [
        { wch: 20 }, // الرمز
        { wch: 15 }, // النوع
        { wch: 40 }, // الميزات
        { wch: 15 }, // الاستخدامات الحالية
        { wch: 15 }, // الاستخدامات القصوى
        { wch: 15 }, // نسبة الاستخدام
        { wch: 20 }, // تاريخ الانتهاء
        { wch: 15 }, // تاريخ الإنشاء
        { wch: 15 }, // الحالة
        { wch: 10 }, // مستخدم
        { wch: 15 }, // منتهي الصلاحية
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'رموز التفعيل');

    // Create summary sheet
    const summaryData = [
        { 'الإحصائيات': 'القيمة' },
        { 'إجمالي الرموز': codes.length },
        { 'الرموز النشطة': codes.filter(c => !c.used && (!c.expires_at || new Date(c.expires_at) > new Date())).length },
        { 'الرموز المستخدمة': codes.filter(c => c.used).length },
        { 'الرموز المنتهية': codes.filter(c => c.expires_at && new Date(c.expires_at) <= new Date()).length },
        { 'الرموز التجريبية': codes.filter(c => c.type === 'trial').length },
        { 'الرموز الكاملة': codes.filter(c => c.type === 'full').length },
        { 'الرموز الجزئية': codes.filter(c => c.type === 'partial').length },
        { 'الرموز المخصصة': codes.filter(c => c.type === 'features' || c.type === 'custom').length },
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'الإحصائيات');

    // Generate and save file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `activation-codes-${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
    
    return fileName;
}; 