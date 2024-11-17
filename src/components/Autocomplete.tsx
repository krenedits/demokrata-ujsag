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
    position: 'fixed',
    zIndex: 1000,
    background: '#242424',
    borderRadius: '4px',
    maxHeight: '500px',
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
                value={input}
                onChange={(e) => {
                    if (!e.target.value) {
                        setter('');
                    }
                    setInput(e.target.value);
                }}
                onSelect={(val) => setter(val)}
                shouldItemRender={(item, value) =>
                    item.toLowerCase().includes(value.toLowerCase())
                }
                menuStyle={menuStyle}
            />
        </div>
    );
}
