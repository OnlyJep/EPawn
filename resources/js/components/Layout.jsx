import React, { useState } from 'react';
import AuthModals from './AuthModals';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({
    children,
    user,
    logo,
    routes,
    errors,
    old,
    openModal,
    year,
    theme,
    onToggleTheme,
}) {
    const [activeModal, setActiveModal] = useState(openModal || '');

    return (
        <>
            <Navbar
                user={user}
                logo={logo}
                routes={routes}
                onOpenModal={setActiveModal}
                theme={theme}
                onToggleTheme={onToggleTheme}
            />
            <main>
                {React.isValidElement(children)
                    ? React.cloneElement(children, { onOpenModal: setActiveModal, user, routes })
                    : children}
            </main>
            <Footer routes={routes} logo={logo} year={year} onOpenModal={setActiveModal} />
            <AuthModals
                activeModal={activeModal}
                onClose={() => setActiveModal('')}
                onSwitch={setActiveModal}
                logo={logo}
                routes={routes}
                errors={errors}
                old={old}
            />
        </>
    );
}
