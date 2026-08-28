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
    /** Optional line under the label — e.g. that titles follow the author. */
    hint?: string;
}

const menuStyle: CSSProperties = {
    overflow: 'auto',
    position: 'absolute',
    zIndex: 1000,
    background: '#ffffff',
    border: '2px solid #241f19',
    borderRadius: '10px',
    boxShadow: '0 14px 34px rgba(36, 31, 25, 0.22)',
    // Roomier than the old 200px: these rows are taller now, and 200px showed
    // three and a half of them.
    maxHeight: '320px',
    top: '100%',
    marginTop: '6px',
    left: 0,
    minWidth: '100%',
};

export default function Autocomplete({
    value,
    setter,
    items,
    label,
    id,
    hint,
    inputProps,
    ...props
}: AutocompleteProps) {
    const [input, setInput] = useState<string>('');

    useEffect(() => {
        setInput(value);
    }, [value]);

    return (
        <div className='autocomplete'>
            <label className='filters-title' htmlFor={id}>{label}</label>
            {hint && <span className='filters-hint'>{hint}</span>}
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
