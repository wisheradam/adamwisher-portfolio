// Validate the deliberately restricted YAML subset used by repository skills.
// JSON-quoted string scalars are valid YAML; no runtime YAML dependency is needed.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const names=['nextjs-engineer','postgresql-architect','playwright-qa','security-auditor','release-engineer'];
const scripts=JSON.parse(readFileSync('package.json','utf8')).scripts;
function validate(text,name,seen){
 const match=/^---\n([\s\S]*?)\n---\n([\s\S]+)$/.exec(text);
 assert(match,`${name}: frontmatter/body required`);
 const meta={};
 for(const line of match[1].split('\n')){
  const field=/^(name|description): (".*")$/.exec(line);
  assert(field,`${name}: use name/description JSON-quoted YAML scalars`);
  assert(!(field[1] in meta),`${name}: duplicate metadata key`);
  meta[field[1]]=JSON.parse(field[2]);
 }
 assert.equal(meta.name,name);assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.name)&&name.length<64);
 assert(typeof meta.description==='string'&&meta.description.length>30);
 assert(!seen.has(meta.name),`${name}: duplicate skill name`);seen.add(meta.name);
 assert(match[2].includes('AGENTS.md')&&match[2].includes('Project Instructions'),`${name}: precedence missing`);
 assert(/^## /m.test(match[2]),`${name}: procedures missing`);
 assert(/Verify|Evidence|Validate|Completion report/.test(match[2]),`${name}: completion requirements missing`);
 assert(!/\bTODO\b|-----BEGIN .*PRIVATE KEY-----|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{30,}/.test(text),`${name}: placeholder or credential pattern`);
 for(const command of text.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g))assert(command[1] in scripts,`${name}: absent npm script ${command[1]}`);
 for(const code of text.matchAll(/`([^`\n]+)`/g)){
  const ref=code[1];
  if(/^(?:app|components|lib|scripts|tests|docs|\.github)\//.test(ref)&&!ref.includes('*'))assert(existsSync(ref),`${name}: absent path ${ref}`);
 }
 assert(!text.includes('\t')&&text.endsWith('\n'),`${name}: Markdown formatting`);
 return meta;
}
const vendorNames=['neon','neon-postgres'];
function validateInventory(entries){
 for(const name of names)assert(entries.includes(name),`${name}: required repository skill missing`);
 for(const name of entries)assert(names.includes(name)||vendorNames.includes(name),`${name}: unrecognized skill directory`);
}
function validateVendor(text,name){
 assert(vendorNames.includes(name));
 const match=/^---\n([\s\S]*?)\n---\n([\s\S]+)$/.exec(text);
 assert(match,`${name}: vendor frontmatter/body required`);
 assert.equal((match[1].match(/^name: .+$/gm)??[]).length,1);
 assert(match[1].split('\n').includes(`name: ${name}`),`${name}: vendor identity mismatch`);
 assert(/^description: >-?\n  \S/m.test(match[1]),`${name}: vendor description missing`);
 assert(match[1].split('\n').includes(`  source: https://github.com/neondatabase/agent-skills/tree/main/skills/${name}`),`${name}: official source missing`);
 assert(/^# /m.test(match[2]),`${name}: vendor procedures missing`);
 assert(!/-----BEGIN .*PRIVATE KEY-----|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{30,}/.test(text),`${name}: credential pattern`);
}
const entries=readdirSync('.agents/skills');
validateInventory(entries);
for(const name of vendorNames.filter(name=>entries.includes(name))){
 validateVendor(readFileSync(`.agents/skills/${name}/SKILL.md`,'utf8'),name);
 console.log(`${name}: optional official vendor identity, source and structure PASS`);
}
const seen=new Set();
for(const name of names){validate(readFileSync(`.agents/skills/${name}/SKILL.md`,'utf8'),name,seen);console.log(`${name}: structure, YAML subset, paths, commands and precedence PASS`);}
// Negative controls prove malformed metadata and broken references fail closed.
const sample=readFileSync('.agents/skills/nextjs-engineer/SKILL.md','utf8');
const brokenSamples=[
 sample.replace('name: "nextjs-engineer"','name: nextjs-engineer'),
 sample+'\n`lib/missing-skill-reference.ts`\n',
 sample+'\nnpm run absent-skill-command\n',
 sample.replace(/^description: .*\n/m,''),
 sample.replace(/^description: .*$/m,'description: "unterminated'),
 sample.replace('name: "nextjs-engineer"','name: "nextjs-engineer"\nname: "nextjs-engineer"'),
];
for(const broken of brokenSamples)assert.throws(()=>validate(broken,'nextjs-engineer',new Set()));
console.log('6 negative controls PASS. Static validation only; not native discovery or behavioral activation.');
validateInventory(names);validateInventory([...names,...vendorNames]);
assert.throws(()=>validateInventory(names.slice(1)));
assert.throws(()=>validateInventory([...names,'unknown-vendor']));
const vendor='---\nname: neon\ndescription: >-\n  Official Neon procedures\nmetadata:\n  source: https://github.com/neondatabase/agent-skills/tree/main/skills/neon\n---\n# Neon\n';
validateVendor(vendor,'neon');
assert.throws(()=>validateVendor(vendor.replace('name: neon','name: other'),'neon'));
assert.throws(()=>validateVendor(vendor.replace('https://github.com/neondatabase/','https://example.com/'),'neon'));
assert.throws(()=>validateVendor(vendor.replace('description: >-','missing: >-'),'neon'));
assert.throws(()=>validateVendor(vendor.replace('# Neon',''),'neon'));
assert.throws(()=>validateVendor(vendor+'\nghp_'+'a'.repeat(30),'neon'));
assert.throws(()=>validateVendor(vendor.replace('name: neon','name: neon\nname: neon'),'neon'));
console.log('Vendor inventory: both installation states and 8 negative controls PASS; repository validation unchanged.');
