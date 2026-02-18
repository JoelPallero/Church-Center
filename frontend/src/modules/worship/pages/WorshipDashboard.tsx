import type { FC } from 'react';

export const WorshipDashboard: FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Worship Hub</h1>
            <p className="text-gray-600">Bienvenido al centro de alabanza.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">Canciones</h3>
                    <p className="text-sm text-gray-500">Gestiona el repertorio.</p>
                </div>
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">Calendario</h3>
                    <p className="text-sm text-gray-500">Ver reuniones próximas.</p>
                </div>
            </div>
        </div>
    );
};
