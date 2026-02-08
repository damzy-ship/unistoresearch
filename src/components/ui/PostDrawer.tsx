import { Drawer } from 'vaul';
import { cn } from '../../lib/utils';
import React from 'react';

interface PostDrawerProps {
    children: React.ReactNode;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

export function PostDrawer({
    children,
    trigger,
    open,
    onOpenChange,
    className,
}: PostDrawerProps) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
            {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" />
                <Drawer.Content
                    className={cn(
                        "bg-gray-900 flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[9999] focus:outline-none border-t border-gray-800",
                        className
                    )}
                >
                    <div className="p-4 bg-gray-900 rounded-t-[20px] flex-1">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-700 mb-6" />
                        <div className="max-w-md mx-auto h-full flex flex-col">
                            {children}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
