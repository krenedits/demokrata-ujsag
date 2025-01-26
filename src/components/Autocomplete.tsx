import { CSSProperties, useEffect, useState } from 'react';
import AutocompleteBasic, { Props } from 'react-autocomplete';

interface AutocompleteProps extends Omit<Props, 'renderItem' | 'getItemValue'> {
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
    ...props
}: AutocompleteProps) {
    const [input, setInput] = useState<string>('');

    useEffect(() => {
        setInput(value);
    }, [value]);

    return (
        <div className='autocomplete'>
            <label className='filters-title'>{label}:</label>
            <AutocompleteBasic
                items={items}
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
                {...props}
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
                getItemValue={(item) => item}
            />
        </div>
    );
}
