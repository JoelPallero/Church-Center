import { createContext, useState, useContext, useCallback, type FC, type ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

type ConfirmOptions = {
    title?: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger';
};

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        if (resolvePromise) resolvePromise(true);
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (resolvePromise) resolvePromise(false);
        setIsOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {options && (
                <Modal 
                    isOpen={isOpen} 
                    onClose={handleCancel} 
                    title={options.title || t('common.confirmTitle') || 'Confirmación'}
                >
                    <div style={{ marginBottom: '24px' }}>
                        {typeof options.message === 'string' ? (
                            <p className="text-body" style={{ margin: 0 }}>{options.message}</p>
                        ) : (
                            options.message
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button 
                            variant="ghost" 
                            onClick={handleCancel}
                            style={{ minWidth: '100px' }}
                        >
                            {options.cancelText || t('common.cancel') || 'Cancelar'}
                        </Button>
                        <Button 
                            variant={options.variant || 'primary'} 
                            onClick={handleConfirm}
                            style={{ minWidth: '100px' }}
                        >
                            {options.confirmText || t('common.confirm') || 'Confirmar'}
                        </Button>
                    </div>
                </Modal>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};
