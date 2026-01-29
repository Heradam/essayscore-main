import React from 'react';

const buildPages = (page, totalPages) => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const pages = [];

    if (start > 1) {
        pages.push(1);
    }
    if (start > 2) {
        pages.push('ellipsis-start');
    }
    for (let i = start; i <= end; i += 1) {
        pages.push(i);
    }
    if (end < totalPages - 1) {
        pages.push('ellipsis-end');
    }
    if (end < totalPages) {
        pages.push(totalPages);
    }

    return pages;
};

const Pagination = ({ page, totalPages, onPageChange, className = '' }) => {
    if (!totalPages || totalPages <= 1) {
        return null;
    }

    const pages = buildPages(page, totalPages);

    return (
        <div className={`flex items-center justify-between gap-3 text-sm ${className}`}>
            <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-600 hover:text-slate-900 hover:border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                上一页
            </button>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                {pages.map((item) => {
                    if (typeof item !== 'number') {
                        return (
                            <span key={item} className="px-2 text-slate-400">
                                ...
                            </span>
                        );
                    }
                    const isActive = item === page;
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => onPageChange(item)}
                            className={`min-w-[36px] px-3 py-2 rounded-xl border transition ${
                                isActive
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                                    : 'bg-white/80 text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-slate-900'
                            }`}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-600 hover:text-slate-900 hover:border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                下一页
            </button>
        </div>
    );
};

export default Pagination;
