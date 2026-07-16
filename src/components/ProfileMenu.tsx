import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Scale, User as UserIcon, ChevronDown, Ban, Shield } from 'lucide-react';
import { isAdminUser } from '../constants/admin';

interface ProfileMenuProps {
    userName: string;
    userId?: string;
    onLogout: () => void;
    onNavigateToProfile: () => void;
    onOpenAdmin?: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    userName,
    userId,
    onLogout,
    onNavigateToProfile,
    onOpenAdmin,
}) => {
    const navigate = useNavigate();
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

    const handleExclusionsClick = () => {
        navigate('/settings/exclusions');
        setIsOpen(false);
    };

    const handleAdminClick = () => {
        onOpenAdmin?.();
        setIsOpen(false);
    };

    const showAdmin = isAdminUser(userId);

    // Usar solo el primer nombre en el botón para ahorrar espacio
    const displayUserName = userName.split(' ')[0];

    return (
        // Contenedor principal con ID para el detector de clics externos
        <div id="profile-menu-container" className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 p-2 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium pr-1">{displayUserName}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-52 origin-top-right bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mt-0.5">Cuenta</p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={handleProfileClick}
                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <Scale className="w-4 h-4" />
                            Actualizar perfil
                        </button>
                        <button
                            onClick={handleExclusionsClick}
                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <Ban className="w-4 h-4" />
                            Ejercicios excluidos
                        </button>
                        {showAdmin && (
                            <button
                                onClick={handleAdminClick}
                                className="w-full text-left px-4 py-2.5 text-sm text-lime-400/90 hover:text-lime-300 hover:bg-zinc-900 flex items-center gap-3 transition-colors"
                                role="menuitem"
                            >
                                <Shield className="w-4 h-4" />
                                Panel de usuarios
                            </button>
                        )}
                        <button
                            onClick={handleLogoutClick}
                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-900 flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileMenu;