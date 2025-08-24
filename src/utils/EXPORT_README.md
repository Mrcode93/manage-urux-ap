# Arabic Export Utility

This utility provides comprehensive export functionality for activation codes in both PDF and Excel formats, with optimized Arabic language support.

## Features

### ✅ PDF Export (English Labels)
- **Professional Layout**: Clean, organized table format with English labels for maximum compatibility
- **No Encoding Issues**: Uses English labels to avoid Arabic text rendering problems in PDFs
- **Comprehensive Data**: Includes all activation code details with proper translations
- **Page Numbering**: Automatic page numbering for multi-page documents
- **Custom Styling**: Professional color scheme and formatting
- **Landscape Orientation**: Optimized for wide tables

### ✅ Excel Export (Full Arabic Support)
- **Complete Arabic Support**: Full Arabic text rendering with proper encoding
- **Multiple Sheets**: Main data sheet + summary statistics sheet
- **Arabic Column Headers**: All headers and labels in Arabic
- **Detailed Information**: Extended columns with usage percentages and status indicators
- **Auto-sized Columns**: Optimized column widths for Arabic text
- **Summary Statistics**: Separate sheet with Arabic statistics by type and status

## Usage

```typescript
import { exportActivationCodes } from './exportUtils';

// Export all codes to PDF (English labels)
await exportActivationCodes({
    format: 'pdf',
    allCodes: activationCodes,
    availableFeatures: features
});

// Export selected codes to Excel (Arabic labels)
await exportActivationCodes({
    format: 'excel',
    includeSelectedOnly: true,
    selectedCodes: ['code1', 'code2'],
    allCodes: activationCodes,
    availableFeatures: features
});
```

## Export Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `format` | `'pdf' \| 'excel'` | Yes | Export format |
| `includeSelectedOnly` | `boolean` | No | Export only selected codes |
| `selectedCodes` | `string[]` | No | Array of selected code IDs |
| `allCodes` | `ActivationCode[]` | Yes | All available codes |
| `availableFeatures` | `Feature[]` | No | Available features for reference |

## Arabic Text Handling

### PDF Export Strategy
- **English Labels**: Uses English translations for all headers and labels
- **Arabic Data**: Preserves Arabic text in data fields where possible
- **Translation Mapping**: Comprehensive translation dictionary for common terms
- **No Encoding Issues**: Eliminates garbled character problems

### Excel Export Strategy
- **Full Arabic Support**: Complete Arabic text rendering
- **Proper Encoding**: Excel handles Arabic text natively
- **RTL Support**: Right-to-left text alignment where appropriate
- **Arabic Locale**: Uses `ar-IQ` locale for date formatting

### Translation Mapping

| Arabic | English |
|--------|---------|
| تقرير رموز التفعيل | Activation Codes Report |
| تاريخ التصدير | Export Date |
| إجمالي الرموز | Total Codes |
| الرمز | Code |
| النوع | Type |
| الميزات | Features |
| الاستخدامات | Usage |
| تاريخ الانتهاء | Expiry Date |
| تاريخ الإنشاء | Creation Date |
| الحالة | Status |
| تجريبي | Trial |
| كامل | Full |
| جزئي | Partial |
| متاح | Available |
| مستنفد | Exhausted |
| منتهي الصلاحية | Expired |

## File Output

### PDF Files
- **Filename**: `activation-codes-YYYY-MM-DD.pdf`
- **Format**: Landscape orientation
- **Language**: English labels with Arabic data where supported
- **Compatibility**: Works across all PDF viewers

### Excel Files
- **Filename**: `activation-codes-YYYY-MM-DD.xlsx`
- **Sheets**: "رموز التفعيل" and "الإحصائيات"
- **Language**: Full Arabic support
- **Encoding**: UTF-8 with proper Arabic rendering

## Error Handling

The utility includes robust error handling:

- **Input Validation**: Validates data before export
- **Arabic Error Messages**: Provides Arabic error messages
- **Graceful Fallbacks**: Handles font and encoding issues
- **Console Warnings**: Debug information for troubleshooting

## Dependencies

Required packages:
- `jspdf` - PDF generation
- `jspdf-autotable` - Table formatting in PDF
- `xlsx` - Excel file generation
- `file-saver` - File download handling

## Performance

- **PDF generation**: ~1-2 seconds for 1000 codes
- **Excel generation**: ~0.5-1 second for 1000 codes
- **Memory usage**: Minimal, processes data in chunks
- **File size**: Optimized for both formats

## Browser Compatibility

- **Chrome/Chromium**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Internet Explorer**: ⚠️ Limited support (not recommended)

## Troubleshooting

### Common Issues

1. **PDF shows garbled Arabic text**
   - **Solution**: PDF export uses English labels to avoid encoding issues
   - **Alternative**: Use Excel export for full Arabic support

2. **Excel file shows garbled Arabic text**
   - **Solution**: Excel should automatically detect Arabic text
   - **Check**: Ensure the file is opened with proper encoding

3. **Font loading errors**
   - **Solution**: PDF uses built-in Helvetica font
   - **Check**: Browser console for warnings

### Debug Mode

Enable debug logging by checking the browser console for:
- Export progress information
- Error messages
- Performance metrics

## Example Output

### PDF Table Headers
```
Code | Type | Features | Usage | Expiry Date | Creation Date | Status
```

### Excel Table Headers
```
الرمز | النوع | الميزات | الاستخدامات | تاريخ الانتهاء | تاريخ الإنشاء | الحالة
```

### Excel Summary
```
الإحصائيات | القيمة
إجمالي الرموز | 150
الرموز النشطة | 120
الرموز المستخدمة | 25
الرموز المنتهية | 5
```

## Future Enhancements

- **Custom Arabic Font Loading**: Advanced font loading for PDFs
- **RTL Layout Improvements**: Better right-to-left support
- **Arabic Number Formatting**: Localized number formatting
- **Custom Export Templates**: User-defined export formats
- **Bilingual Support**: Option to export in both languages 