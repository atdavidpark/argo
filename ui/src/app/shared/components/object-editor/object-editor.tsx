import {languages} from 'monaco-editor/esm/vs/editor/editor.api';
import * as React from 'react';
import {createRef, useEffect, useState} from 'react';
import MonacoEditor from 'react-monaco-editor';
import {uiUrl} from '../../base';
import {ScopedLocalStorage} from '../../scoped-local-storage';
import {ErrorNotice} from '../error-notice';
import {parse, stringify} from '../object-parser';
import {ToggleButton} from '../toggle-button';

interface Props<T> {
    type: string;
    value: T;
    buttons?: React.ReactNode;
    onChange?: (value: T) => void;
}

const defaultLang = 'yaml';

export const ObjectEditor = <T extends any>({type, value, buttons, onChange}: Props<T>) => {
    const storage = new ScopedLocalStorage('object-editor');
    const [lang, setLang] = useState<string>(storage.getItem('lang', defaultLang));
    const [error, setError] = useState<Error>();

    useEffect(() => storage.setItem('lang', lang, defaultLang), [lang]);

    useEffect(() => {
        if (type && lang === 'json') {
            const uri = uiUrl('assets/openapi-spec/swagger.json');
            fetch(uri)
                .then(res => res.json())
                .then(swagger => {
                    // adds auto-completion to JSON only
                    languages.json.jsonDefaults.setDiagnosticsOptions({
                        validate: true,
                        schemas: [
                            {
                                uri,
                                fileMatch: ['*'],
                                schema: {
                                    $id: 'http://workflows.argoproj.io/' + type + '.json',
                                    $ref: '#/definitions/' + type,
                                    $schema: 'http://json-schema.org/draft-07/schema',
                                    definitions: swagger.definitions
                                }
                            }
                        ]
                    });
                })
                .catch(setError);
        }
    }, [lang, type]);

    const editor = createRef<MonacoEditor>();

    return (
        <>
            <div style={{paddingBottom: '1em'}}>
                <ToggleButton toggled={lang === 'yaml'} onToggle={() => setLang(lang === 'yaml' ? 'json' : 'yaml')}>
                    YAML
                </ToggleButton>
                {buttons}
            </div>
            <ErrorNotice error={error} style={{margin: 0}} />
            <div
                onBlur={() => {
                    if (onChange) {
                        let x;
                        try {
                            x = parse(editor.current.editor.getModel().getValue());
                        } catch (e) {
                            setError(e);
                            return;
                        }
                        onChange(x);
                    }
                }}>
                <MonacoEditor
                    ref={editor}
                    key='editor'
                    value={stringify(value, lang)}
                    language={lang}
                    height='600px'
                    options={{
                        readOnly: onChange === null,
                        minimap: {enabled: false},
                        lineNumbers: 'off',
                        renderIndentGuides: false
                    }}
                />
            </div>
            <div style={{paddingTop: '1em'}}>
                {onChange && (
                    <>
                        <i className='fa fa-info-circle' />{' '}
                        {lang === 'json' ? <>Full auto-completion enabled.</> : <>Basic completion for YAML. Switch to JSON for full auto-completion.</>}
                    </>
                )}{' '}
                <a href='https://argoproj.github.io/argo/ide-setup/'>Learn how to get auto-completion in your IDE.</a>
            </div>
        </>
    );
};
