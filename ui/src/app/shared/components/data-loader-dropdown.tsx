import {Select} from 'argo-ui';
import * as React from 'react';
import {useState} from 'react';

export const DataLoaderDropdown = ({onChange, load}: {load: Promise<string[]>; onChange: (value: string) => void}) => {
    const [list, setList] = useState<string[]>();
    const [error, setError] = useState<Error>();
    const [selected, setSelected] = useState('');

    useState(() => {
        load.then(setList)
            .then(() => setError(null))
            .catch(setError);
    });

    return (
        <Select
            options={list || (error ? [error.message] : [])}
            value={selected}
            onChange={x => {
                setSelected(x.value);
                onChange(x.value);
            }}
        />
    );
};
