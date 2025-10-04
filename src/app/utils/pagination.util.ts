export function getVisiblePages(currentPage: number, totalPages: number, maxVisiblePages: number = 5): number[] {
    const halfVisible: number = Math.floor(maxVisiblePages / 2);

    let startPage: number = Math.max(0, currentPage - halfVisible);
    let endPage: number = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    const pages: number[] = [];
    for (let i: number = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
}
