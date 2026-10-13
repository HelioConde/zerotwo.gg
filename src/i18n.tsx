import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ZtLanguage='pt-BR'|'en';

const STORAGE_KEY='zt_language';
const LanguageContext=createContext<{language:ZtLanguage;setLanguage:(language:ZtLanguage)=>void}>({
  language:'pt-BR',
  setLanguage:()=>{}
});

// English translations are a separate chunk; PT-BR is the source language.
type EnglishDictionary=typeof import('./i18n/en');
let englishDictionary:EnglishDictionary|null=null;

function translateString(value:string){
  if(!value)return value;
  const dictionary=englishDictionary;
  if(!dictionary)return value;
  const exact=dictionary.EN[value.trim()];
  if(exact){
    const leading=value.match(/^\s*/)?.[0]||'';
    const trailing=value.match(/\s*$/)?.[0]||'';
    return leading+exact+trailing;
  }
  let next=value;
  for(const [pattern,replacement] of dictionary.RULES)next=next.replace(pattern,replacement);
  return next;
}

const originals=new WeakMap<Text,string>();
const lastAppliedText=new WeakMap<Text,string>();
const knownTextNodes=new Set<Text>();
const attrOriginals=new WeakMap<Element,Map<string,string>>();
const lastAppliedAttrs=new WeakMap<Element,Map<string,string>>();
const knownAttrElements=new Set<Element>();
const ATTRS=['placeholder','title','aria-label'] as const;

function shouldSkip(node:Node){
  const parent=node.parentElement;
  return !parent||!!parent.closest('[data-i18n-skip],script,style,code,pre');
}
function processTextNode(node:Text,language:ZtLanguage,refreshOriginal=false){
  if(shouldSkip(node))return;
  const current=node.nodeValue||'';
  if(!originals.has(node)){originals.set(node,current);knownTextNodes.add(node)}
  else if(refreshOriginal&&lastAppliedText.get(node)!==current)originals.set(node,current);
  const original=originals.get(node)||'';
  const target=language==='en'?translateString(original):original;
  lastAppliedText.set(node,target);
  if(current!==target)node.nodeValue=target;
}
function processElement(element:Element,language:ZtLanguage,refreshOriginal=false){
  let saved=attrOriginals.get(element);
  let applied=lastAppliedAttrs.get(element);
  for(const attr of ATTRS){
    if(!element.hasAttribute(attr))continue;
    if(!saved){saved=new Map();attrOriginals.set(element,saved);knownAttrElements.add(element)}
    if(!applied){applied=new Map();lastAppliedAttrs.set(element,applied)}
    const current=element.getAttribute(attr)||'';
    if(!saved.has(attr))saved.set(attr,current);
    else if(refreshOriginal&&applied.get(attr)!==current)saved.set(attr,current);
    const original=saved.get(attr)||'';
    const target=language==='en'?translateString(original):original;
    applied.set(attr,target);
    if(current!==target)element.setAttribute(attr,target);
  }
}
function processTree(root:Node,language:ZtLanguage,refreshOriginal=false){
  if(root.nodeType===Node.TEXT_NODE){processTextNode(root as Text,language,refreshOriginal);return}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE)processElement(root as Element,language,refreshOriginal);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let node=walker.nextNode();
  while(node){
    if(node.nodeType===Node.TEXT_NODE)processTextNode(node as Text,language,refreshOriginal);
    else if(node.nodeType===Node.ELEMENT_NODE)processElement(node as Element,language,refreshOriginal);
    node=walker.nextNode();
  }
}
function cleanup(){
  for(const node of [...knownTextNodes])if(!node.isConnected)knownTextNodes.delete(node);
  for(const element of [...knownAttrElements])if(!element.isConnected)knownAttrElements.delete(element);
}

let activeLanguage:ZtLanguage='pt-BR';
let hadEnglishTranslation=false;
export function getLanguage(){return activeLanguage}
export function getLocale(){return activeLanguage==='en'?'en-US':'pt-BR'}

export function I18nProvider({children}:{children:React.ReactNode}){
  const [englishReady,setEnglishReady]=useState(false);
  const [language,setLanguageState]=useState<ZtLanguage>(()=>{
    const query=new URLSearchParams(location.search).get('lang');
    if(query==='en'||query==='pt-BR')return query;
    return localStorage.getItem(STORAGE_KEY)==='en'?'en':'pt-BR';
  });

  const setLanguage=(next:ZtLanguage)=>{
    localStorage.setItem(STORAGE_KEY,next);
    setLanguageState(next);
  };

  useEffect(()=>{
    if(language!=='en'||englishDictionary)return;
    let cancelled=false;
    void import('./i18n/en').then(dictionary=>{
      englishDictionary=dictionary;
      if(!cancelled)setEnglishReady(true);
    }).catch(()=>{ /* Keep the original Portuguese text if offline. */ });
    return()=>{cancelled=true;};
  },[language]);

  useEffect(()=>{
    activeLanguage=language;
    document.documentElement.lang=language;
    const english=language==='en';
    const title=english?'ZeroTwo.gg — Your Riot Life':'ZeroTwo.gg — Sua Riot Life';
    const description=english
      ?'ZeroTwo.gg turns permitted Riot data into a personal League of Legends experience: history, champions, mastery, sessions, and changes over time.'
      :'ZeroTwo.gg transforma dados permitidos da Riot em uma experiência pessoal de League of Legends: história, partidas, campeões, maestria, sessões e mudanças ao longo do tempo.';
    document.title=title;
    const setMeta=(selector:string,value:string)=>document.querySelector(selector)?.setAttribute('content',value);
    setMeta('meta[name="description"]',description);
    setMeta('meta[property="og:title"]',title);
    setMeta('meta[property="og:description"]',description);
    setMeta('meta[property="og:locale"]',english?'en_US':'pt_BR');
    setMeta('meta[name="twitter:title"]',title);
    setMeta('meta[name="twitter:description"]',description);
    // Portuguese is authored directly in JSX. Avoid walking every DOM node
    // and installing a costly MutationObserver for the default PT-BR visitor.
    // When switching back from English, restore the remembered source text.
    // Wait for the optional English dictionary. PT-BR never needs this chunk.
    if(english&&!englishDictionary)return;
    if(english||hadEnglishTranslation)processTree(document.body,language,english);
    hadEnglishTranslation=english;
    window.dispatchEvent(new CustomEvent('zt:language-change',{detail:{language}}));
    if(!english)return;
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')processTextNode(record.target as Text,language,true);
        if(record.type==='attributes')processElement(record.target as Element,language,true);
        for(const node of record.addedNodes)processTree(node,language);
      }
      cleanup();
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...ATTRS]});
    return()=>observer.disconnect();
  },[language,englishReady]);

  const value=useMemo(()=>({language,setLanguage}),[language]);
  return <LanguageContext.Provider value={value}>
    {children}
    <div className="ztLanguageSwitcher" data-i18n-skip aria-label="Language">
      <button title="Português (Brasil)" className={language==='pt-BR'?'active':''} onClick={()=>setLanguage('pt-BR')} aria-pressed={language==='pt-BR'}>PT-BR</button>
      <button title="English" className={language==='en'?'active':''} onClick={()=>setLanguage('en')} aria-pressed={language==='en'}>EN</button>
    </div>
  </LanguageContext.Provider>;
}

export function useLanguage(){return useContext(LanguageContext)}
export function t(value:string,language:ZtLanguage=activeLanguage){return language==='en'?translateString(value):value}
