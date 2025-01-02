import { CSSProperties, useEffect, useState } from 'react';
import AutocompleteBasic from 'react-autocomplete';

interface AutocompleteProps {
    value: string;
    setter: (value: string) => void;
    items: string[];
    label: string;
}

const menuStyle: CSSProperties = {
    overflow: 'auto',
    position: 'absolute',
    zIndex: 1000,
    background: '#242424',
    borderRadius: '4px',
    maxHeight: '200px',
    top: 50,
    left: 0,
    maxWidth: '350px',
};

const htmlToString = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent ?? '';
};

export default function Autocomplete({
    value,
    setter,
    items,
    label,
}: AutocompleteProps) {
    const [input, setInput] = useState<string>('');

    useEffect(() => {
        setInput(value);
    }, [value]);

    return (
        <div className='autocomplete'>
            <label className='filters-title'>{label}:</label>
            <AutocompleteBasic
                getItemValue={(item) => item}
                items={items}
                renderItem={(item, isHighlighted) => (
                    <div
                        key={item}
                        className={
                            'filter-item' +
                            (isHighlighted ? ' highlighted' : '')
                        }
                        dangerouslySetInnerHTML={{ __html: item }}
                    />
                )}
                value={htmlToString(input)}
                onChange={(e) => {
                    if (!e.target.value) {
                        setter('');
                    }
                    setInput(e.target.value);
                }}
                onSelect={(val) => setter(val)}
                shouldItemRender={(item, value) =>
                    htmlToString(item)
                        .toLowerCase()
                        .includes(htmlToString(value).toLowerCase())
                }
                menuStyle={menuStyle}
                wrapperStyle={{ position: 'relative' }}
            />
        </div>
    );
}
