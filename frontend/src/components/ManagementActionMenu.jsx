import React, { useEffect, useMemo, useState } from 'react';

const ManagementActionMenu = ({ title = 'Actions', actions, currentAction, onActionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeLabel = useMemo(
        () => actions.find(action => action.key === currentAction)?.label || title,
        [actions, currentAction, title],
    );

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleActionClick = (key) => {
        onActionChange(key);
        setIsOpen(false);
    };

    return (
        <div className="management-action-shell">
            <button
                type="button"
                className={`management-action-toggle ${isOpen ? 'open' : ''}`}
                aria-expanded={isOpen}
                aria-controls="management-action-drawer"
                onClick={() => setIsOpen(open => !open)}
            >
                <span className="management-action-toggle-icon" aria-hidden="true" />
                <span>{activeLabel}</span>
            </button>

            <button
                type="button"
                className={`management-action-backdrop ${isOpen ? 'open' : ''}`}
                aria-label={`Close ${title} menu`}
                onClick={() => setIsOpen(false)}
            />

            <aside
                id="management-action-drawer"
                className={`management-action-drawer ${isOpen ? 'open' : ''}`}
                aria-hidden={!isOpen}
            >
                <div className="management-action-drawer-header">
                    <div>
                        <span>Section</span>
                        <h2>{title}</h2>
                    </div>
                    <button
                        type="button"
                        className="management-action-close"
                        aria-label={`Close ${title} menu`}
                        onClick={() => setIsOpen(false)}
                    >
                        <span aria-hidden="true" />
                    </button>
                </div>
                <nav className="management-action-list" aria-label={title}>
                    {actions.map(action => (
                        <button
                            key={action.key}
                            type="button"
                            className={currentAction === action.key ? 'active' : ''}
                            onClick={() => handleActionClick(action.key)}
                        >
                            {action.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </div>
    );
};

export default ManagementActionMenu;
