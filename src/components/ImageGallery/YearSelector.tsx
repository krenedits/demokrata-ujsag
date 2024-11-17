import fileList from '../../fileList.json';
import './ImageGallery.css';

interface YearSelectorProps {
    selectedImage: string | null;
    filteredYears: string[];
}

export default function YearSelector({
    selectedImage,
    filteredYears,
}: YearSelectorProps) {
    const selectedYear = selectedImage?.split('/')[2] as keyof typeof fileList;

    return (
        <ul className='year-selector'>
            {filteredYears.map((year) => (
                <li key={year}>
                    <a
                        href={`#${year}`}
                        className={year === selectedYear ? 'active' : ''}
                    >
                        {year}
                    </a>
                </li>
            ))}
        </ul>
    );
}
