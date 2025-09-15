import React from 'react';

// Base typography component props
interface TypographyProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'muted' | 'accent' | 'destructive';
    align?: 'left' | 'center' | 'right';
    as?: keyof JSX.IntrinsicElements;
}

// Heading component props
interface HeadingProps extends Omit<TypographyProps, 'variant'> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: 'default' | 'gradient' | 'muted';
    gradient?: boolean;
}

// Text component props
interface TextProps extends TypographyProps {
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    weight?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    leading?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
}

// Utility function to combine classes
const cn = (...classes: (string | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
};

// Base variants
const baseVariants = {
    default: 'text-slate-900 dark:text-slate-100',
    muted: 'text-slate-600 dark:text-slate-400',
    accent: 'text-blue-600 dark:text-blue-400',
    destructive: 'text-red-600 dark:text-red-400',
};

// Alignment classes
const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};

// Heading Component
export const Heading: React.FC<HeadingProps> = ({
    children,
    level = 1,
    variant = 'default',
    gradient = false,
    align = 'left',
    className,
    as,
    ...props
}) => {
    const Component = as || (`h${level}` as keyof JSX.IntrinsicElements);

    const baseClasses = 'font-bold leading-tight tracking-tight';

    const sizeClasses = {
        1: 'text-4xl md:text-5xl lg:text-6xl',
        2: 'text-3xl md:text-4xl lg:text-5xl',
        3: 'text-2xl md:text-3xl lg:text-4xl',
        4: 'text-xl md:text-2xl lg:text-3xl',
        5: 'text-lg md:text-xl lg:text-2xl',
        6: 'text-base md:text-lg lg:text-xl',
    };

    const variantClasses = {
        default: gradient ?
            'bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent' :
            'text-slate-900 dark:text-slate-100',
        gradient: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent',
        muted: 'text-slate-700 dark:text-slate-300',
    };

    const classes = cn(
        baseClasses,
        sizeClasses[level],
        variantClasses[variant],
        alignmentClasses[align],
        className
    );

    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    );
};

// Text Component
export const Text: React.FC<TextProps> = ({
    children,
    size = 'base',
    weight = 'normal',
    leading = 'normal',
    variant = 'default',
    align = 'left',
    className,
    as = 'p',
    ...props
}) => {
    const Component = as;

    const sizeClasses = {
        xs: 'text-xs',
        sm: 'text-sm',
        base: '',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
    };

    const weightClasses = {
        thin: 'font-thin',
        extralight: 'font-extralight',
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold',
    };

    const leadingClasses = {
        none: 'leading-none',
        tight: 'leading-tight',
        snug: 'leading-snug',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed',
        loose: 'leading-loose',
    };

    const classes = cn(
        sizeClasses[size],
        weightClasses[weight],
        leadingClasses[leading],
        baseVariants[variant],
        alignmentClasses[align],
        className
    );

    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    );
};

// Lead Text Component (for introductory text)
export const Lead: React.FC<Omit<TextProps, 'size'>> = ({ className, ...props }) => {
    return (
        <Text
            size="xl"
            leading="relaxed"
            className={cn('text-slate-700 dark:text-slate-300', className)}
            {...props}
        />
    );
};

// Large Text Component
export const Large: React.FC<Omit<TextProps, 'size'>> = ({ className, ...props }) => {
    return (
        <Text
            size="lg"
            weight="semibold"
            className={className}
            {...props}
        />
    );
};

// Small Text Component
export const Small: React.FC<Omit<TextProps, 'size'>> = ({ className, ...props }) => {
    return (
        <Text
            size="sm"
            leading="none"
            className={cn('text-slate-600 dark:text-slate-400', className)}
            {...props}
        />
    );
};

// Muted Text Component
export const Muted: React.FC<Omit<TextProps, 'variant'>> = ({ className, ...props }) => {
    return (
        <Text
            variant="muted"
            className={cn('text-sm', className)}
            {...props}
        />
    );
};

// Blockquote Component
interface BlockquoteProps {
    children: React.ReactNode;
    className?: string;
    cite?: string;
}

export const Blockquote: React.FC<BlockquoteProps> = ({ children, className, cite }) => {
    return (
        <blockquote className={cn(
            'mt-6 border-l-2 pl-6 italic border-slate-300 dark:border-slate-600',
            className
        )}>
            <Text variant="muted" leading="relaxed">
                {children}
            </Text>
            {cite && (
                <footer className="mt-2">
                    <Small>— {cite}</Small>
                </footer>
            )}
        </blockquote>
    );
};

// Code Component
interface CodeProps {
    children: React.ReactNode;
    className?: string;
    block?: boolean;
}

export const Code: React.FC<CodeProps> = ({ children, className, block = false }) => {
    if (block) {
        return (
            <pre className={cn(
                'mt-6 mb-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4',
                className
            )}>
                <code className="text-sm font-mono text-slate-900 dark:text-slate-100">
                    {children}
                </code>
            </pre>
        );
    }

    return (
        <code className={cn(
            'relative rounded bg-slate-100 dark:bg-slate-800 px-[0.3rem] py-[0.2rem] font-mono text-sm text-slate-900 dark:text-slate-100',
            className
        )}>
            {children}
        </code>
    );
};

// List Components
interface ListProps {
    children: React.ReactNode;
    className?: string;
}

export const List: React.FC<ListProps> = ({ children, className }) => {
    return (
        <ul className={cn('my-6 ml-6 list-disc text-slate-900 dark:text-slate-100', className)}>
            {children}
        </ul>
    );
};

export const OrderedList: React.FC<ListProps> = ({ children, className }) => {
    return (
        <ol className={cn('my-6 ml-6 list-decimal text-slate-900 dark:text-slate-100', className)}>
            {children}
        </ol>
    );
};

export const ListItem: React.FC<ListProps> = ({ children, className }) => {
    return (
        <li className={cn('mt-2', className)}>
            {children}
        </li>
    );
};

// Link Component with beautiful hover effects
interface LinkProps {
    children: React.ReactNode;
    href: string;
    className?: string;
    variant?: 'default' | 'subtle' | 'accent';
    external?: boolean;
}

export const Link: React.FC<LinkProps> = ({
    children,
    href,
    className,
    variant = 'default',
    external = false
}) => {
    const variantClasses = {
        default: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline underline-offset-4',
        subtle: 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:underline underline-offset-4',
        accent: 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 underline underline-offset-4',
    };

    return (
        <a
            href={href}
            className={cn(
                'transition-colors duration-200 font-medium',
                variantClasses[variant],
                className
            )}
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        >
            {children}
        </a>
    );
};

// Badge Component for tags, labels etc.
interface BadgeProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'secondary' | 'accent' | 'destructive' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default' }) => {
    const variantClasses = {
        default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
        accent: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        outline: 'text-slate-950 border border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-800',
    };

    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300',
            variantClasses[variant],
            className
        )}>
            {children}
        </span>
    );
};

// Divider Component
export const Divider: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <hr className={cn(
            'my-8 border-0 h-px bg-slate-200 dark:bg-slate-700',
            className
        )} />
    );
};

// Export default object with all components for easy importing
const Typography = {
    Heading,
    Text,
    Lead,
    Large,
    Small,
    Muted,
    Blockquote,
    Code,
    List,
    OrderedList,
    ListItem,
    Link,
    Badge,
    Divider,
};

export default Typography;