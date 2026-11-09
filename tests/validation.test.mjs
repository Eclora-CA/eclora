import test from 'node:test';
import assert from 'node:assert/strict';
import {validContactEmail,validContactPhone} from '../src/lib/validation.mjs';

test('Email validation accepts real-world formats and rejects malformed addresses',()=>{
  for(const value of ['info@eclora.ca','nom+pro@exemple.ca',' test@exemple.ca '])assert.equal(validContactEmail(value),true,value);
  for(const value of ['test','a@b','a@@b.ca','a@-b.ca','a..b@exemple.ca'])assert.equal(validContactEmail(value),false,value);
});
test('Phone validation supports North American numbers, international prefixes, extensions and optional empty fields',()=>{
  for(const value of ['','514 555-0123','+1 (514) 555-0123','613-555-0123 poste 123','+33 6 12 34 56 78'])assert.equal(validContactPhone(value),true,value);
  for(const value of ['123','bonjour','1234567890','5145550123abc','+151455501'])assert.equal(validContactPhone(value),false,value);
});
