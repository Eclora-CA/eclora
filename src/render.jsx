import React from 'react';
import {renderToString} from 'react-dom/server';
import {App} from './App.jsx';

export function render(page,year){return renderToString(<App page={page} year={year}/>);}
