import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <thead className={`bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/80 ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = true }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${
        hoverable ? 'hover:bg-indigo-50/40 dark:hover:bg-slate-800/50' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <th className={`px-4 py-3.5 text-left ${className}`}>{children}</th>;
};

export const TableCell: React.FC<{ children: React.ReactNode; className?: string; colSpan?: number }> = ({
  children,
  className = '',
  colSpan,
}) => {
  return (
    <td colSpan={colSpan} className={`px-4 py-3.5 align-middle ${className}`}>
      {children}
    </td>
  );
};
