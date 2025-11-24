import React from 'react';
import styles from './ReviewModal.module.css';
import { ScanResultData } from '../utils/imageProcessing';

interface ReviewModalProps {
  data: ScanResultData | null;
  onConfirm: () => void;
  onRetake: () => void;
  isOpen: boolean;
  currentTotal: number;
  targetTotal: number;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  data, 
  onConfirm, 
  onRetake, 
  isOpen,
  currentTotal,
  targetTotal
}) => {
  if (!isOpen || !data) return null;

  const { newCodes, duplicateCodes, processedImage } = data;
  const newCount = newCodes.length;
  const dupCount = duplicateCodes.length;
  
  // Calculate how many codes we will actually add
  const remainingSlots = Math.max(0, targetTotal - currentTotal);
  const countToAdd = Math.min(newCount, remainingSlots);
  const canAdd = countToAdd > 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <img src={processedImage} alt="Scan Review" className={styles.previewImage} />
        </div>
        
        <div className={styles.info}>
          <h3 className={styles.title}>Результат сканирования</h3>
          <p className={styles.details}>
            Найдено кодов: <b>{data.totalFound}</b>
            <br />
            <span className={styles.newCount}>Новых: {newCount}</span>
            {" • "}
            <span className={styles.dupCount}>Повторов: {dupCount}</span>
          </p>
          <p className={styles.details}>
            Прогресс набора: {currentTotal} → {currentTotal + countToAdd} / {targetTotal}
          </p>
        </div>

        <div className={styles.actions}>
           <button 
            className={`${styles.button} ${styles.retakeButton}`} 
            onClick={onRetake}
          >
            Переснять
          </button>
          <button 
            className={`${styles.button} ${styles.confirmButton}`} 
            onClick={onConfirm}
            disabled={!canAdd}
          >
            {canAdd ? `Добавить (+${countToAdd})` : 'Нет новых'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
