import { CSSProperties, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import AutocompleteBasic, { Props } from 'react-autocomplete';

// react-autocomplete ships class-component types written against an older
// @types/react (its `Component` shape is missing the now-required `refs`
// property), so TS rejects it as a JSX component type. The underlying JS
// component works fine at runtime — only the type declaration is stale —
// so we re-assert its type once here instead of suppressing every usage.
const AutocompleteField = AutocompleteBasic as unknown as ComponentType<Props>;

interface AutocompleteProps extends Omit<Props, 'renderItem' | 'getItemValue'> {
    value: string;
    setter: (value: string) => void;
    items: string[];
    label: string;
    id: string;
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

export default function Autocomplete({
    value,
    setter,
    items,
    label,
    id,
    inputProps,
    ...props
}: AutocompleteProps) {
    const [input, setInput] = useState<string>('');

    useEffect(() => {
        setInput(value);
    }, [value]);

    return (
        <div className='autocomplete'>
            <label className='filters-title' htmlFor={id}>{label}:</label>
            <AutocompleteField
                items={items}
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
                wrapperStyle={{ position: 'relative' }}
                inputProps={{ id, ...inputProps }}
                {...props}
                renderItem={(item, isHighlighted) => (
                    <div
                        key={item}
                        className={
                            'filter-item' +
                            (isHighlighted ? ' highlighted' : '')
                        }
                    >
                        {item}
                    </div>
                )}
                getItemValue={(item) => item}
            />
        </div>
    );
}
