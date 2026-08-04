import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import{
  BookOpen,Brain,FolderKanban,Lightbulb,LogOut,Play,CheckCircle2,
  ChevronRight,Clock3,HelpCircle,UserRound,KeyRound,
  RotateCcw,Send,Settings,ClipboardList,Sparkles,Trophy
}from'lucide-react';
import'./styles.css';

const supabase=createClient(
  'https://kxlvdhofagbseytqqegm.supabase.co',
  'sb_publishable_wQEIXLTw60ap2HxgpCkUbg_wpA0Auiw'
);

const GOALS=[
  ['programming','Программирование'],['english','Английский'],['math','Математика'],
  ['cognition','Когнитивное развитие'],['psychology','Психология'],
  ['health','Здоровье'],['income','Доход и фриланс']
];

function normalize(value){return String(value??'').trim().replace(/\s+/g,' ')}
function evaluateExercise(exercise,value){
  const spec=exercise.answer_spec||{};
  if(exercise.exercise_type==='single_choice')return value===spec.correct_index;
  if(Array.isArray(spec.accepted))return spec.accepted.map(normalize).includes(normalize(value));
  const text=String(value??'');
  const required=spec.required_patterns||[];
  const forbidden=spec.forbidden_patterns||[];
  return required.every(pattern=>text.includes(pattern))&&
    forbidden.every(pattern=>!text.includes(pattern))&&
    (!spec.line_count_min||text.trim().split(/\n/).filter(Boolean).length>=spec.line_count_min);
}

function Auth(){
  const[mode,setMode]=useState('login');
  const[name,setName]=useState('');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState(false);

  async function submit(){
    if(!email.trim()){setMsg('Введите email');return}
    if(mode==='forgot'){
      setBusy(true);setMsg('Отправляю письмо…');
      const redirectTo=`${window.location.origin}${window.location.pathname}?recovery=1`;
      const{error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});
      setBusy(false);setMsg(error?error.message:'Письмо для восстановления отправлено. Проверьте почту.');
      return;
    }
    if(password.length<6){setMsg('Пароль должен содержать не менее 6 символов');return}
    setBusy(true);setMsg(mode==='login'?'Выполняется вход…':'Создаётся аккаунт…');
    try{
      const result=mode==='login'
        ?await supabase.auth.signInWithPassword({email:email.trim(),password})
        :await supabase.auth.signUp({
          email:email.trim(),password,
          options:{data:{display_name:name.trim()||email.split('@')[0]}}
        });
      if(result.error)throw result.error;
      setMsg(mode==='login'?'Вход выполнен':'Аккаунт создан. После входа откроется персональная анкета.');
    }catch(error){setMsg(error?.message||'Ошибка соединения. Проверьте интернет или VPN.')}finally{setBusy(false)}
  }

  return <main className="authPage"><section className="authCard">
    <div className="authBrand"><BookOpen/><div><h1>Академия Макарова</h1><p>Персональное обучение с преподавателем</p></div></div>
    {mode==='signup'&&<label>Имя<input value={name}onChange={e=>setName(e.target.value)}placeholder="Как к вам обращаться"/></label>}
    <label>Email<input type="email"value={email}onChange={e=>setEmail(e.target.value)}placeholder="name@example.com"/></label>
    {mode!=='forgot'&&<label>Пароль<input type="password"value={password}onChange={e=>setPassword(e.target.value)}placeholder="Не менее 6 символов"onKeyDown={e=>e.key==='Enter'&&submit()}/></label>}
    <button className="primary wide"disabled={busy}onClick={submit}>
      {busy?'Подождите…':mode==='login'?'Войти':mode==='signup'?'Создать аккаунт':'Восстановить пароль'}
    </button>
    <div className="authLinks">
      {mode!=='login'&&<button onClick={()=>{setMode('login');setMsg('')}}>Уже есть аккаунт</button>}
      {mode==='login'&&<button onClick={()=>{setMode('signup');setMsg('')}}>Регистрация</button>}
      {mode!=='forgot'&&<button onClick={()=>{setMode('forgot');setMsg('')}}>Забыли пароль?</button>}
    </div>
    <small className="statusText"aria-live="polite">{msg}</small>
  </section></main>;
}

function PasswordRecovery({onDone}){
  const[password,setPassword]=useState('');
  const[confirm,setConfirm]=useState('');
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState(false);
  async function save(){
    if(password.length<6){setMsg('Пароль должен содержать не менее 6 символов');return}
    if(password!==confirm){setMsg('Пароли не совпадают');return}
    setBusy(true);
    const{error}=await supabase.auth.updateUser({password});
    setBusy(false);
    if(error){setMsg(error.message);return}
    setMsg('Пароль изменён');
    window.history.replaceState({},'',window.location.pathname);
    setTimeout(onDone,500);
  }
  return <main className="authPage"><section className="authCard">
    <KeyRound className="largeIcon"/><h1>Новый пароль</h1>
    <p>Введите новый пароль для аккаунта.</p>
    <label>Новый пароль<input type="password"value={password}onChange={e=>setPassword(e.target.value)}/></label>
    <label>Повторите пароль<input type="password"value={confirm}onChange={e=>setConfirm(e.target.value)}/></label>
    <button className="primary wide"disabled={busy}onClick={save}>{busy?'Сохраняю…':'Изменить пароль'}</button>
    <small className="statusText">{msg}</small>
  </section></main>;
}

function GoalPicker({selected,onChange}){
  function toggle(id){onChange(selected.includes(id)?selected.filter(x=>x!==id):[...selected,id])}
  return <div className="choiceGrid">{GOALS.map(([id,label])=><button key={id}className={selected.includes(id)?'choice selected':'choice'}onClick={()=>toggle(id)}>{selected.includes(id)&&<CheckCircle2/>}{label}</button>)}</div>;
}

function Onboarding({user,initialProfile,onComplete,onCancel}){
  const[step,setStep]=useState(0);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState('');
  const[form,setForm]=useState({
    display_name:initialProfile?.display_name||user.user_metadata?.display_name||'',
    age_range:initialProfile?.age_range||'18-24',
    primary_goal:initialProfile?.primary_goal||'',
    learning_goals:initialProfile?.learning_goals||['programming'],
    subject_levels:initialProfile?.subject_levels||{programming:1,english:1,math:1,cognition:1},
    weekly_hours:initialProfile?.weekly_hours||5,
    preferred_session_minutes:initialProfile?.preferred_session_minutes||45,
    schedule_type:initialProfile?.schedule_type||'regular',
    schedule_details:initialProfile?.schedule_details||'',
    energy_pattern:initialProfile?.energy_pattern||'variable',
    constraints:Array.isArray(initialProfile?.constraints)?initialProfile.constraints.join(', '):'',
    work_context:initialProfile?.work_context||''
  });
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  const levels=['programming','english','math','cognition'];

  async function finish(){
    if(!form.display_name.trim()||!form.primary_goal.trim()||!form.learning_goals.length){setMsg('Заполните имя, главную цель и направления');return}
    setBusy(true);setMsg('Создаю персональную среду…');
    const constraints=form.constraints.split(',').map(x=>x.trim()).filter(Boolean);
    const payload={
      user_id:user.id,display_name:form.display_name.trim(),age_range:form.age_range,
      primary_goal:form.primary_goal.trim(),learning_goals:form.learning_goals,
      subject_levels:form.subject_levels,weekly_hours:Number(form.weekly_hours)||null,
      preferred_session_minutes:Number(form.preferred_session_minutes)||45,
      schedule_type:form.schedule_type,schedule_details:form.schedule_details.trim(),
      energy_pattern:form.energy_pattern,constraints,work_context:form.work_context.trim(),
      onboarding_completed:true,teacher_mode:true,profile_version:2,updated_at:new Date().toISOString()
    };
    const{error}=await supabase.from('profiles').upsert(payload,{onConflict:'user_id'});
    if(error){setBusy(false);setMsg(error.message);return}
    const rules=[
      'Все занятия проходят через преподавателя',
      form.schedule_type==='irregular_shift'?'Перед занятием уточнять доступное время и состояние':'Соблюдать регулярный недельный ритм',
      form.energy_pattern==='variable'?'Менять нагрузку по текущей энергии':'Учитывать предпочтительное время продуктивности'
    ];
    await supabase.from('learning_plans').update({status:'archived'}).eq('user_id',user.id).eq('status','active');
    await supabase.from('learning_plans').insert({
      user_id:user.id,title:'Персональный стартовый план',status:'active',
      plan:{mode:form.schedule_type==='regular'?'regular':'adaptive',priority_tracks:form.learning_goals,weekly_hours:Number(form.weekly_hours),session_minutes:Number(form.preferred_session_minutes),rules,target:form.primary_goal}
    });
    setBusy(false);onComplete(payload);
  }

  return <main className="onboardingPage"><section className="onboardingCard">
    <div className="wizardTop"><div><span>Персональная настройка</span><h1>{initialProfile?.onboarding_completed?'Изменить учебный профиль':'Создадим вашу Академию'}</h1></div><b>{step+1}/4</b></div>
    <div className="wizardProgress"><i style={{width:`${(step+1)*25}%`}}/></div>
    {step===0&&<div className="wizardSection"><h2>Кто вы и к чему идёте?</h2><label>Как к вам обращаться<input value={form.display_name}onChange={e=>set('display_name',e.target.value)}/></label><label>Возраст<select value={form.age_range}onChange={e=>set('age_range',e.target.value)}><option>до 18</option><option>18-24</option><option>25-34</option><option>35-44</option><option>45+</option></select></label><label>Главная цель<textarea value={form.primary_goal}onChange={e=>set('primary_goal',e.target.value)}placeholder="Например: освоить программирование и сменить профессию"/></label></div>}
    {step===1&&<div className="wizardSection"><h2>Что вы хотите изучать?</h2><GoalPicker selected={form.learning_goals}onChange={v=>set('learning_goals',v)}/><h3>Текущий уровень от 0 до 10</h3>{levels.map(id=><label className="rangeRow"key={id}><span>{GOALS.find(g=>g[0]===id)?.[1]}</span><input type="range"min="0"max="10"value={form.subject_levels[id]||0}onChange={e=>set('subject_levels',{...form.subject_levels,[id]:Number(e.target.value)})}/><b>{form.subject_levels[id]||0}</b></label>)}</div>}
    {step===2&&<div className="wizardSection"><h2>Как устроена ваша жизнь?</h2><label>Режим<select value={form.schedule_type}onChange={e=>set('schedule_type',e.target.value)}><option value="regular">Стабильный график</option><option value="student">Учёба и экзамены</option><option value="shift">Сменная работа</option><option value="irregular_shift">Нерегулярные смены и поездки</option><option value="variable">График постоянно меняется</option></select></label><label>Опишите работу, учёбу и свободные окна<textarea value={form.schedule_details}onChange={e=>set('schedule_details',e.target.value)}placeholder="Например: свободен по вечерам, выходные плавающие"/></label><label>Контекст жизни или работы<textarea value={form.work_context}onChange={e=>set('work_context',e.target.value)}placeholder="Что преподавателю важно учитывать?"/></label></div>}
    {step===3&&<div className="wizardSection"><h2>Нагрузка и ограничения</h2><label>Часов в неделю<input type="number"min="1"max="60"value={form.weekly_hours}onChange={e=>set('weekly_hours',e.target.value)}/></label><label>Обычная длительность занятия<select value={form.preferred_session_minutes}onChange={e=>set('preferred_session_minutes',e.target.value)}><option value="20">20 минут</option><option value="30">30 минут</option><option value="45">45 минут</option><option value="60">60 минут</option><option value="90">90 минут</option></select></label><label>Энергия чаще всего<select value={form.energy_pattern}onChange={e=>set('energy_pattern',e.target.value)}><option value="morning">Выше утром</option><option value="evening">Выше вечером</option><option value="stable">Обычно стабильная</option><option value="variable">Сильно меняется</option></select></label><label>Ограничения через запятую<textarea value={form.constraints}onChange={e=>set('constraints',e.target.value)}placeholder="Сон, усталость, здоровье, поездки, дети…"/></label></div>}
    <div className="wizardActions">{onCancel&&<button className="secondary"onClick={onCancel}>Отмена</button>}{step>0&&<button className="secondary"onClick={()=>setStep(step-1)}>Назад</button>}<span/>{step<3?<button className="primary"onClick={()=>setStep(step+1)}>Далее<ChevronRight/></button>:<button className="primary"disabled={busy}onClick={finish}>{busy?'Сохраняю…':'Создать план'}<Sparkles/></button>}</div>
    <small className="statusText">{msg}</small>
  </section></main>;
}

function ExerciseInput({exercise,value,onChange}){
  if(exercise.exercise_type==='single_choice')return <div className="teacherOptions">{(exercise.options||[]).map((option,index)=><button key={option}className={value===index?'selected':''}onClick={()=>onChange(index)}>{option}</button>)}</div>;
  return <textarea className="teacherAnswer"value={value||''}onChange={e=>onChange(e.target.value)}placeholder="Введите ответ или код…"/>;
}

function TeacherRoom({user,profile,onSessionSaved}){
  const[phase,setPhase]=useState('setup');
  const[course,setCourse]=useState(null);
  const[lesson,setLesson]=useState(null);
  const[exercises,setExercises]=useState([]);
  const[current,setCurrent]=useState(0);
  const[answer,setAnswer]=useState('');
  const[attempts,setAttempts]=useState(0);
  const[hintIndex,setHintIndex]=useState(-1);
  const[messages,setMessages]=useState([]);
  const[sessionId,setSessionId]=useState(null);
  const[energy,setEnergy]=useState(6);
  const[minutes,setMinutes]=useState(profile.preferred_session_minutes||45);
  const[busy,setBusy]=useState(false);
  const[summary,setSummary]=useState(null);
  const[resultLog,setResultLog]=useState([]);

  useEffect(()=>{(async()=>{
    const{data:c}=await supabase.from('courses').select('*').eq('slug','python-level-1').maybeSingle();
    setCourse(c||null);
    if(!c)return;
    const{data:l}=await supabase.from('offline_lessons').select('*').eq('course_id',c.id).eq('published',true).order('lesson_number').limit(1).maybeSingle();
    setLesson(l||null);
    if(l){const{data:e}=await supabase.from('lesson_exercises').select('*').eq('lesson_id',l.id).order('position');setExercises(e||[])}
  })()},[]);

  const limit=useMemo(()=>energy<=3?Math.min(3,exercises.length):energy>=8?Math.min(7,exercises.length):Math.min(5,exercises.length),[energy,exercises.length]);
  const exercise=exercises[current];

  async function persistMessage(role,content,metadata={}){
    if(!sessionId)return;
    await supabase.from('tutor_messages').insert({session_id:sessionId,user_id:user.id,role,content,metadata});
  }
  function addMessage(role,content,metadata={}){setMessages(currentMessages=>[...currentMessages,{role,content,metadata,id:crypto.randomUUID()}])}

  async function start(){
    if(!lesson||!exercises.length)return;
    setBusy(true);
    const snapshot={display_name:profile.display_name,primary_goal:profile.primary_goal,schedule_type:profile.schedule_type,constraints:profile.constraints,energy,minutes};
    const{data,error}=await supabase.from('tutor_sessions').insert({user_id:user.id,course_id:course?.id,lesson_id:lesson.id,status:'active',mode:'guided',profile_snapshot:snapshot,state:{exercise_index:0,energy,minutes}}).select('id').single();
    setBusy(false);if(error)return;
    setSessionId(data.id);setPhase('teaching');
    const intro=`Привет, ${profile.display_name||'ученик'}. Сегодня я веду занятие по теме «${lesson.title}». У нас ${minutes} минут, энергия ${energy}/10, поэтому я выбрал ${limit} заданий. Я буду давать материал небольшими шагами, проверять ответы и менять объём подсказок.`;
    addMessage('teacher',intro);await supabase.from('tutor_messages').insert({session_id:data.id,user_id:user.id,role:'teacher',content:intro,metadata:{type:'intro'}});
    const prompt=`Начнём с вопроса ${exercises[0].position}: ${exercises[0].prompt}`;
    addMessage('teacher',prompt,{type:'exercise'});await supabase.from('tutor_messages').insert({session_id:data.id,user_id:user.id,role:'teacher',content:prompt,metadata:{exercise_id:exercises[0].id}});
  }

  async function submitAnswer(){
    if(answer===null||String(answer).trim()==='')return;
    const ok=evaluateExercise(exercise,answer);
    const studentText=exercise.exercise_type==='single_choice'?(exercise.options||[])[answer]:String(answer);
    addMessage('student',studentText);await persistMessage('student',studentText,{exercise_id:exercise.id,attempt:attempts+1});
    await supabase.from('exercise_attempts').insert({user_id:user.id,exercise_id:exercise.id,answer:{value:answer},is_correct:ok,score:ok?1:0,hints_used:Math.max(0,hintIndex+1),feedback:ok?exercise.explanation:'Нужна повторная попытка'});
    const newAttempts=attempts+1;
    setResultLog(log=>[...log,{exercise_id:exercise.id,ok,attempt:newAttempts,hints:Math.max(0,hintIndex+1)}]);
    if(ok){
      const feedback=`Верно. ${exercise.explanation||'Главный принцип применён правильно.'}`;
      addMessage('teacher',feedback,{correct:true});await persistMessage('teacher',feedback,{exercise_id:exercise.id,correct:true});
      if(current+1>=limit){await finishSession();return}
      const next=exercises[current+1];
      const nextText=`Хорошо. Теперь следующий шаг: ${next.prompt}`;
      addMessage('teacher',nextText,{type:'exercise'});await persistMessage('teacher',nextText,{exercise_id:next.id});
      setCurrent(current+1);setAnswer(next.exercise_type==='single_choice'?null:'');setAttempts(0);setHintIndex(-1);
    }else{
      const hints=exercise.hints||[];
      const nextHint=Math.min(Math.max(0,hintIndex+1),Math.max(0,hints.length-1));
      setHintIndex(nextHint);setAttempts(newAttempts);
      const feedback=newAttempts>=3
        ?`Пока неверно. Разберём: ${exercise.explanation||'Сравни структуру ответа с условием и исправь только одну ключевую ошибку.'}`
        :`Пока неверно. Подсказка ${nextHint+1}: ${hints[nextHint]||'Вернись к условию и проверь каждый обязательный элемент.'}`;
      addMessage('teacher',feedback,{correct:false,hint:nextHint+1});await persistMessage('teacher',feedback,{exercise_id:exercise.id,correct:false,hint:nextHint+1});
      setAnswer(exercise.exercise_type==='single_choice'?null:'');
    }
  }

  async function requestHint(){
    const hints=exercise?.hints||[];if(!hints.length)return;
    const next=Math.min(hints.length-1,hintIndex+1);setHintIndex(next);
    const text=`Подсказка ${next+1}: ${hints[next]}`;
    addMessage('teacher',text,{hint:next+1});await persistMessage('teacher',text,{exercise_id:exercise.id,hint:next+1});
  }

  async function finishSession(){
    const log=[...resultLog];
    const uniqueCorrect=new Set(log.filter(x=>x.ok).map(x=>x.exercise_id)).size+1;
    const mastery=Math.round(uniqueCorrect/limit*100);
    const text=`Занятие завершено. Освоение текущего блока: ${mastery}%. Правильных заданий: ${uniqueCorrect} из ${limit}. ${mastery>=80?'Можно двигаться дальше.':'Следующее занятие начнём с короткого повторения ошибок.'}`;
    addMessage('teacher',text,{type:'summary',mastery});await persistMessage('teacher',text,{type:'summary',mastery});
    await supabase.from('tutor_sessions').update({status:mastery>=80?'completed':'needs_review',ended_at:new Date().toISOString(),state:{exercise_index:current,mastery,limit,energy,minutes}}).eq('id',sessionId);
    await supabase.from('lesson_attempts').insert({user_id:user.id,lesson_id:lesson.id,status:mastery>=80?'completed':'needs_review',answer:'teacher_guided',self_score:Math.max(1,Math.round(mastery/20)),hints_used:log.reduce((sum,item)=>sum+(item.hints||0),0),completed_at:new Date().toISOString(),result:{mastery,correct:uniqueCorrect,total:limit,mode:'teacher_guided'}});
    setSummary({mastery,correct:uniqueCorrect,total:limit});setPhase('complete');onSessionSaved?.();
  }

  function reset(){setPhase('setup');setCurrent(0);setAnswer('');setAttempts(0);setHintIndex(-1);setMessages([]);setSessionId(null);setSummary(null);setResultLog([])}

  if(phase==='setup')return <section className="teacherStart">
    <div className="teacherIdentity"><div className="teacherAvatar"><Sparkles/></div><div><span>Персональный преподаватель</span><h1>Начать занятие</h1><p>Материал открывается только внутри диалога. Преподаватель задаёт вопросы, проверяет ответ и решает, когда двигаться дальше.</p></div></div>
    <div className="teacherSetupGrid"><label>Сколько времени есть сейчас?<select value={minutes}onChange={e=>setMinutes(Number(e.target.value))}><option value="20">20 минут</option><option value="30">30 минут</option><option value="45">45 минут</option><option value="60">60 минут</option><option value="90">90 минут</option></select></label><label>Энергия сейчас <b>{energy}/10</b><input type="range"min="1"max="10"value={energy}onChange={e=>setEnergy(Number(e.target.value))}/></label></div>
    <div className="profileContext"><b>Что преподаватель учтёт</b><p>{profile.schedule_details||profile.work_context||'Вашу цель, расписание, текущий уровень и доступное время.'}</p></div>
    <button className="primary startButton"disabled={!lesson||busy}onClick={start}><Play/>{busy?'Создаю занятие…':lesson?'Начать с преподавателем':'Загружаю программу…'}</button>
  </section>;

  return <section className="teacherRoom">
    <header className="teacherHeader"><div><span>Занятие с преподавателем</span><h1>{lesson?.title}</h1></div><div className="teacherStats"><span><Clock3/>{minutes} мин</span><span>{Math.min(current+1,limit)}/{limit}</span></div></header>
    <div className="chatStream">{messages.map(message=><article key={message.id}className={`chatMessage ${message.role}`}><div>{message.role==='teacher'?<Sparkles/>:<UserRound/>}</div><p>{message.content}</p></article>)}</div>
    {phase==='teaching'&&exercise&&<div className="responsePanel">{exercise.starter_code&&<pre>{exercise.starter_code}</pre>}<ExerciseInput exercise={exercise}value={answer}onChange={setAnswer}/><div className="responseActions"><button className="secondary"onClick={requestHint}><HelpCircle/>Нужна подсказка</button><button className="primary"disabled={answer===null||String(answer).trim()===''}onClick={submitAnswer}><Send/>Ответить преподавателю</button></div></div>}
    {phase==='complete'&&<div className="sessionComplete"><Trophy/><h2>{summary.mastery}% освоения</h2><p>{summary.correct} из {summary.total} заданий выполнено правильно.</p><button className="primary"onClick={reset}><RotateCcw/>Новое занятие</button></div>}
  </section>;
}

function PlanPage({profile,plan}){
  const data=plan?.plan||{};
  return <section className="pageBlock"><header><div><span>Индивидуальная система</span><h1>Ваш учебный план</h1><p>{data.target||profile.primary_goal}</p></div></header><div className="planGrid"><article className="panel"><h2>Приоритеты</h2><div className="tagList">{(data.priority_tracks||profile.learning_goals||[]).map(id=><span key={id}>{GOALS.find(g=>g[0]===id)?.[1]||id}</span>)}</div></article><article className="panel"><h2>Ритм</h2><p><b>{data.weekly_hours||profile.weekly_hours||'Адаптивно'}</b> часов в неделю</p><p><b>{data.session_minutes||profile.preferred_session_minutes}</b> минут на обычное занятие</p></article><article className="panel widePanel"><h2>Правила преподавателя</h2><ul>{(data.rules||['Учитывать профиль и текущую энергию','Вести урок вопросами и практикой','Не открывать готовое решение до попытки']).map(rule=><li key={rule}>{rule}</li>)}</ul></article></div></section>;
}

function AccountPage({user,profile,onEdit}){
  const[password,setPassword]=useState('');const[confirm,setConfirm]=useState('');const[msg,setMsg]=useState('');const[busy,setBusy]=useState(false);
  async function changePassword(){if(password.length<6){setMsg('Минимум 6 символов');return}if(password!==confirm){setMsg('Пароли не совпадают');return}setBusy(true);const{error}=await supabase.auth.updateUser({password});setBusy(false);setMsg(error?error.message:'Пароль успешно изменён');if(!error){setPassword('');setConfirm('')}}
  return <section className="pageBlock"><header><div><span>Безопасность и персонализация</span><h1>Аккаунт</h1><p>{user.email}</p></div></header><div className="accountGrid"><article className="panel"><UserRound className="sectionIcon"/><h2>{profile.display_name}</h2><p>{profile.primary_goal}</p><dl><dt>Режим</dt><dd>{profile.schedule_type}</dd><dt>Занятие</dt><dd>{profile.preferred_session_minutes} минут</dd><dt>Роль</dt><dd>{profile.role==='owner'?'Владелец Академии':'Ученик'}</dd></dl><button className="secondary"onClick={onEdit}><Settings/>Изменить анкету</button></article><article className="panel"><KeyRound className="sectionIcon"/><h2>Сменить пароль</h2><label>Новый пароль<input type="password"value={password}onChange={e=>setPassword(e.target.value)}/></label><label>Повторите пароль<input type="password"value={confirm}onChange={e=>setConfirm(e.target.value)}/></label><button className="primary"disabled={busy}onClick={changePassword}>{busy?'Сохраняю…':'Изменить пароль'}</button><small className="statusText">{msg}</small></article></div></section>;
}

function SimpleDataPage({type,user}){
  const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);
  const config={
    projects:{title:'Проекты',table:'projects',icon:FolderKanban,empty:'Проекты появятся, когда преподаватель назначит практическую работу.'},
    base:{title:'База знаний',table:'knowledge_entries',icon:Lightbulb,empty:'Здесь будут факты, выводы, гипотезы и вопросы из занятий.'},
    map:{title:'Карта знаний',table:'topics',icon:Brain,empty:'Карта будет расти после проверенных ответов и повторений.'}
  }[type];
  useEffect(()=>{(async()=>{const{data}=await supabase.from(config.table).select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);setItems(data||[]);setLoading(false)})()},[type]);
  const Icon=config.icon;
  return <section className="pageBlock"><header><div><span>Результаты работы с преподавателем</span><h1>{config.title}</h1></div></header>{loading?<p>Загрузка…</p>:items.length?<div className="dataList">{items.map(item=><article className="panel"key={item.id}><h2>{item.title}</h2><p>{item.goal||item.content||item.status||''}</p></article>)}</div>:<div className="emptyPanel"><Icon/><h2>Пока пусто</h2><p>{config.empty}</p></div>}</section>;
}

function App(){
  const[user,setUser]=useState(null);
  const[profile,setProfile]=useState(null);
  const[plan,setPlan]=useState(null);
  const[loading,setLoading]=useState(true);
  const[page,setPage]=useState('teacher');
  const[recovery,setRecovery]=useState(new URLSearchParams(window.location.search).has('recovery'));
  const[editingProfile,setEditingProfile]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setLoading(false)});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      setUser(session?.user||null);
      if(event==='PASSWORD_RECOVERY')setRecovery(true);
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(activeUser=user){
    if(!activeUser)return;
    let{data}=await supabase.from('profiles').select('*').eq('user_id',activeUser.id).maybeSingle();
    if(!data){
      const seed={user_id:activeUser.id,display_name:activeUser.user_metadata?.display_name||activeUser.email?.split('@')[0],timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',onboarding_completed:false};
      await supabase.from('profiles').upsert(seed,{onConflict:'user_id'});data=seed;
    }
    setProfile(data);
    const{data:activePlan}=await supabase.from('learning_plans').select('*').eq('user_id',activeUser.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle();
    setPlan(activePlan||null);
  }
  useEffect(()=>{if(user)loadProfile(user);else{setProfile(null);setPlan(null)}},[user]);

  if(loading)return <div className="screenLoader">Загрузка Академии…</div>;
  if(recovery&&user)return <PasswordRecovery onDone={()=>setRecovery(false)}/>;
  if(!user)return <Auth/>;
  if(!profile)return <div className="screenLoader">Загрузка профиля…</div>;
  if(!profile.onboarding_completed||editingProfile)return <Onboarding user={user}initialProfile={profile}onCancel={profile.onboarding_completed?()=>setEditingProfile(false):null}onComplete={saved=>{setProfile({...profile,...saved});setEditingProfile(false);loadProfile(user)}}/>;

  const nav=[
    ['teacher','Преподаватель',Sparkles],['plan','Мой план',ClipboardList],['map','Карта знаний',Brain],
    ['projects','Проекты',FolderKanban],['base','База знаний',Lightbulb],['account','Аккаунт',UserRound]
  ];
  return <div className="appShell"><aside className="appAside"><div className="brand"><BookOpen/><div>Академия<br/>Макарова</div></div><div className="profileMini"><div>{profile.display_name?.[0]?.toUpperCase()||'У'}</div><span><b>{profile.display_name}</b><small>{profile.role==='owner'?'Владелец':'Персональный план'}</small></span></div><nav>{nav.map(([id,label,Icon])=><button key={id}className={page===id?'active':''}onClick={()=>setPage(id)}><Icon/>{label}</button>)}</nav><button className="logout"onClick={()=>supabase.auth.signOut()}><LogOut/>Выйти</button></aside><main className="appMain">
    {page==='teacher'&&<TeacherRoom user={user}profile={profile}onSessionSaved={()=>loadProfile(user)}/>} 
    {page==='plan'&&<PlanPage profile={profile}plan={plan}/>} 
    {page==='map'&&<SimpleDataPage type="map"user={user}/>} 
    {page==='projects'&&<SimpleDataPage type="projects"user={user}/>} 
    {page==='base'&&<SimpleDataPage type="base"user={user}/>} 
    {page==='account'&&<AccountPage user={user}profile={profile}onEdit={()=>setEditingProfile(true)}/>} 
    <footer>Версия 4.0 · обучение только с преподавателем</footer>
  </main></div>;
}

createRoot(document.getElementById('root')).render(<App/>);