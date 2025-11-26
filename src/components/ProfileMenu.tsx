import React, { useState, useEffect } from 'react';
import { LogOut, Scale, User as UserIcon, ChevronDown } from 'lucide-react';

interface ProfileMenuProps {
    userName: string;
    onLogout: () => void;
    onNavigateToProfile: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ userName, onLogout, onNavigateToProfile }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Lógica para cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            // Utilizamos 'closest' para verificar si el clic está dentro del contenedor del menú
            const menuContainer = document.getElementById('profile-menu-container');
            // Verifica si el clic ocurrió fuera del contenedor del menú
            if (menuContainer && !menuContainer.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        
        // Solo añade el listener si el menú está abierto
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        
        // Función de limpieza para remover el listener
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]); // Dependencia en 'isOpen' para re-ejecutar el efecto cuando cambie

    const handleProfileClick = () => {
        onNavigateToProfile();
        setIsOpen(false);
    };

    const handleLogoutClick = () => {
        onLogout();
        setIsOpen(false);
    };

    // Usar solo el primer nombre en el botón para ahorrar espacio
    const displayUserName = userName.split(' ')[0];

    return (
        // Contenedor principal con ID para el detector de clics externos
        <div id="profile-menu-container" className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 bg-zinc-700/50 rounded-full text-zinc-300 hover:bg-zinc-700 transition"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium pr-1">{displayUserName}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-zinc-800 border border-zinc-700 divide-y divide-zinc-700 rounded-md shadow-2xl animate-in slide-in-from-top-1 duration-200"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="p-3">
                        <p className="text-sm font-bold text-white truncate">{userName}</p>
                        <p className="text-xs text-zinc-500">Opciones de cuenta</p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={handleProfileClick}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-lime-400 flex items-center gap-3"
                            role="menuitem"
                        >
                            <Scale className="w-4 h-4" />
                            Actualizar Perfil
                        </button>
                        <button
                            onClick={handleLogoutClick}
                            className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-900/20 hover:text-red-400 flex items-center gap-3"
                            role="menuitem"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileMenu;