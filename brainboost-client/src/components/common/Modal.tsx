import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnClickOutside?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  closeOnClickOutside = true,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnClickOutside &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling of the body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-container ${size}`} ref={modalRef}>
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
