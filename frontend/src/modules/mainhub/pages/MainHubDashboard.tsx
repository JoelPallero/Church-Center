import type { FC } from 'react';

export const MainHubDashboard: FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">MainHub</h1>
            <p className="text-gray-600">Gestión eclesiástica centralizada.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">Personas</h3>
                    <p className="text-sm text-gray-500">Membresía y registros.</p>
                </div>
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">Informes</h3>
                    <p className="text-sm text-gray-500">Estadísticas y datos.</p>
                </div>
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">Iglesias</h3>
                    <p className="text-sm text-gray-500">Configuración de congregación.</p>
                </div>
            </div>
        </div>
    );
};
