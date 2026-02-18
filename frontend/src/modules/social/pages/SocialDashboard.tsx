import type { FC } from 'react';
import { Card } from '../../../components/ui/Card';

export const SocialDashboard: FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
                <h1 className="text-h1">Social Media Hub</h1>
                <p className="text-body">Bienvenido al módulo de gestión de redes sociales.</p>
            </header>
            <section>
                <Card>
                    <p className="text-body">Este módulo está en desarrollo.</p>
                </Card>
            </section>
        </div>
    );
};


