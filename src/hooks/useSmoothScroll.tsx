import { useEffect } from 'react';

export default function useSmoothScroll() {
    useEffect(() => {
        const anchors = document.querySelectorAll('a[href^="#"]');
        const handlers: Array<{ anchor: Element; handler: (e: Event) => void }> =
            [];

        anchors.forEach((anchor) => {
            const handler = (e: Event) => {
                e.preventDefault();
                const target = e.currentTarget as HTMLAnchorElement;
                const href = target.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const targetId = href.replace('#', '');
                    document.getElementById(targetId)?.scrollIntoView({
                        behavior: 'smooth',
                    });
                }
            };
            anchor.addEventListener('click', handler);
            handlers.push({ anchor, handler });
        });

        return () => {
            handlers.forEach(({ anchor, handler }) => {
                anchor.removeEventListener('click', handler);
            });
        };
    }, []);
}
