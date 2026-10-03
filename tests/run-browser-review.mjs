import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,lstat,rm} from 'node:fs/promises';
import path from 'node:path';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await mkdir('tests/artifacts',{recursive:true});
const profile=await mkdtemp(path.resolve('tests/artifacts/edge-review-'));
const server=spawn(process.execPath,['server.mjs'],{cwd:process.env.PIXELPALS_REVIEW_ROOT??process.cwd(),windowsHide:true,stdio:'ignore'});
const browser=spawn(path.join(process.env['ProgramFiles(x86)'],'Microsoft','Edge','Application','msedge.exe'),['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking','--remote-debugging-port=9232','--user-data-dir='+profile,'--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','about:blank'],{windowsHide:true,stdio:'ignore'});
try{
 let ready=false;
 for(let i=0;i<100;i++){try{const result=await fetch('http://127.0.0.1:9232/json',{signal:AbortSignal.timeout(1000)});if(result.ok){ready=true;break;}}catch{}await sleep(100);}
 if(!ready)throw new Error('Browser did not start');
 for(const file of process.argv.slice(2)){
  const args=file.split('::');
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{windowsHide:true,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(file+' exited '+code)));});
 }
}finally{
 // Edge may hand off to a different process and exit its launcher. Identify
 // the actual headless parent by this run's exact private profile directory.
 const quote=value=>"'"+value.replaceAll("'","''")+"'",command=`$owned=@(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains(${quote(profile)}) -and $_.CommandLine.Contains('--headless=new') -and $_.CommandLine.Contains('--remote-debugging-port=9232') }); foreach($reviewProcess in $owned){ & $env:SystemRoot/System32/taskkill.exe /PID $reviewProcess.ProcessId /T /F | Out-Null }`;
 const stopped=await new Promise(resolve=>{const cleanup=spawn(path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-Command',command],{windowsHide:true,stdio:'inherit'});cleanup.on('error',()=>{browser.kill();resolve(false);});cleanup.on('exit',code=>{if(code)console.error('Headless review cleanup failed: '+code);resolve(code===0);});});server.kill();
 // Remove only this run's explicitly verified temporary directory.
 if(stopped&&path.dirname(profile)===path.resolve('tests/artifacts')&&path.basename(profile).startsWith('edge-review-')&&!(await lstat(profile)).isSymbolicLink())try{await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}catch(error){console.error('Temporary review profile cleanup failed: '+error.message);}
}
