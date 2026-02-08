import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import React from 'react';

interface DrawerProps {
    children?: React.ReactNode;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
    className?: string; // Content class
}

export function AppDrawer({
    children,
    trigger,
    open,
    onOpenChange,
    title,
    description,
    className,
}: DrawerProps) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
            {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" />
                <Drawer.Content
                    className={cn(
                        "bg-white dark:bg-gray-900 flex flex-col rounded-t-[20px] h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-[9999] focus:outline-none border-t border-gray-200 dark:border-gray-800",
                        className
                    )}
                >
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-t-[20px] flex-1 overflow-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-6" />
                        <div className="max-w-md mx-auto">
                            {title && <Drawer.Title className="font-bold text-2xl mb-2 text-gray-900 dark:text-gray-100">{title}</Drawer.Title>}
                            {description && <Drawer.Description className="text-gray-500 dark:text-gray-400 mb-6">{description}</Drawer.Description>}
                            {children}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
