import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'medium',
  shadow = 'small',
  rounded = true,
  ...props 
}) => {
  const baseClasses = 'bg-white border border-gray-200';
  
  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
    xl: 'p-8'
  };

  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const roundedClass = rounded ? 'rounded-lg' : '';

  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClass} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
