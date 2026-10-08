import type { ReactNode } from 'react';

import './Modal.scss';

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

function Modal({
  title,
  children,
  onClose,
}: ModalProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="modal__header">
          <h2 className="modal__title">
            {title}
          </h2>

          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>

        <div className="modal__content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;