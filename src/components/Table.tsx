import React from 'react';

export interface Column<T = any> {
    header: string;
    accessorKey: string;
    cell?: (props: { row: { original: T } }) => React.ReactNode;
}

interface TableProps<T = any> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
    headerClassName?: string;
    rowClassName?: string;
    cellClassName?: string;
    headerCellClassName?: string;
}

export default function Table<T>({
    columns,
    data,
    isLoading,
    emptyMessage = 'No data available',
    className = 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
    headerClassName = 'bg-gray-50 dark:bg-gray-800',
    rowClassName = 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
    cellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
    headerCellClassName = 'px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
}: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="min-h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // Ensure data is an array
    const tableData = Array.isArray(data) ? data : [];
    
    if (!tableData || tableData.length === 0) {
        return (
            <div className="min-h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className={className}>
                <thead className={headerClassName}>
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                scope="col"
                                className={headerCellClassName}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowClassName}>
                            {columns.map((column, colIndex) => (
                                <td
                                    key={colIndex}
                                    className={cellClassName}
                                >
                                    {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey as keyof T]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}