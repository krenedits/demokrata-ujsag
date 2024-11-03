import { useEffect } from 'react';

export default function useSmoothScroll() {
    useEffect(() => {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = e.target as HTMLAnchorElement;
                document
                    .getElementById(
                        (target.getAttribute('href') ?? '').replace('#', '')
                    )
                    ?.scrollIntoView({
                        behavior: 'smooth',
                    });
            });
        });
    }, []);
}
