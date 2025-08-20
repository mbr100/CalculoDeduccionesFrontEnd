type SavingState = 'idle' | 'saving' | 'success' | 'error';
interface MonthConfig {
    key: keyof BbccPersonalDTO;
    label: string;
    shortLabel: string;
    icon: string;
}
