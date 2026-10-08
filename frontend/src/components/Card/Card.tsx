import type { ReactNode } from 'react';

import './Card.scss';

type CardProps = {
  children: ReactNode;
  className?: string;
};

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export default Card;