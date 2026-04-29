import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';
import React from 'react';

// A minimal script to test if App renders without crashing
// We need to bypass CSS imports though.
console.log('Script loaded.');
