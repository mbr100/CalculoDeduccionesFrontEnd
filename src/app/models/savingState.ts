type SavingState = 'idle' | 'saving' | 'success' | 'error';

type ModalMode = 'create' | 'edit' | 'view' | null;

interface MonthConfig {
    key: keyof BbccPersonalDTO;
    label: string;
    shortLabel: string;
    icon: string;
}
