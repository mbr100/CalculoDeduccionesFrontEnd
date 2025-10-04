import {BbccPersonalDTO} from './personal-economico';

export type SavingState = 'idle' | 'saving' | 'success' | 'error';
export type ModalMode = 'create' | 'edit' | 'view' | null;


export interface MonthConfig {
    key: keyof BbccPersonalDTO;
    label: string;
    shortLabel: string;
    icon: string;
}

export function getVisiblePages(current: number, total: number, maxVisible: number = 5): number[] {
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(0, current - halfVisible);
    let endPage = Math.min(total - 1, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
}
