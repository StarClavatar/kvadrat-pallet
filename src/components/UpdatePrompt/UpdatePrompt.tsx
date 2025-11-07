import React, { useState } from 'react';
import './UpdatePrompt.css';

interface UpdatePromptProps {
    onUpdate: () => void;
    onClose: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateClick = () => {
        setIsLoading(true);
        onUpdate();
    };

    return (
        <div className="update-prompt">
            <div className="update-prompt__text">
                <p className="update-prompt__title">Доступно обновление</p>
                <p className="update-prompt__subtitle">Перезагрузить приложение?</p>
            </div>
            <div className="update-prompt__buttons">
                <button className="update-prompt__button" onClick={onClose} disabled={isLoading}>Закрыть</button>
                <button 
                    className="update-prompt__button update-prompt__button--confirm" 
                    onClick={handleUpdateClick}
                    disabled={isLoading}
                >
                    {isLoading ? <div className="button-loader"></div> : 'Обновить'}
                    {/* Загрузчик обновления */}
                </button>
            </div>
        </div>
    );
};

export default UpdatePrompt;
