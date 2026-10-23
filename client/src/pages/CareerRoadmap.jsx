import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Map, Sparkles, CheckCircle, Circle, Clock, TrendingUp, BookOpen,
         FolderGit2, Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import { careerAPI } from '@/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TASK_TYPES = { skill: BookOpen, project: FolderGit2, interview: TrendingUp }

export default function CareerRoadmapPage() {
  const qc = useQueryClient()
  const [targetRole, setTargetRole] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['career-roadmap'],
    queryFn:  () => careerAPI.getRoadmap(),
  })

  const generateMut = useMutation({
    mutationFn: (data) => careerAPI.generateRoadmap(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['career-roadmap'] }); toast.success('Career roadmap generated!') },
    onError: () => toast.error('Failed to generate roadmap. Ensure resume is uploaded and analyzed.'),
  })

  const taskMut = useMutation({
    mutationFn: ({ id, data }) => careerAPI.updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['career-roadmap'] }),
  })

  const roadmap  = data?.data?.data
  const tasks    = roadmap?.tasks || []
  const done     = tasks.filter(t => t.completed).length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Career Roadmap</h1>
          <p className="text-navy-500 text-sm mt-0.5">AI-generated skill gap analysis and learning plan</p>
        </div>
        {roadmap && (
          <button
            onClick={() => generateMut.mutate({ targetRole: roadmap.targetRole })}
            disabled={generateMut.isPending}
            className="btn-secondary btn-sm gap-2"
          >
            {generateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Regenerate
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="card h-28 skeleton" />)}</div>
      ) : !roadmap ? (
        <div className="card card-body flex flex-col items-center py-14 text-center gap-4">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-500">
            <Map size={28} />
          </div>
          <div>
            <p className="font-semibold text-navy-800 text-lg">Generate your career roadmap</p>
            <p className="text-sm text-navy-400 mt-1 max-w-sm mx-auto">
              The AI will analyze your resume and target role to identify skill gaps and create a personalized learning plan.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <input
              className="input text-sm mb-3"
              placeholder="Target role (e.g. Backend Engineer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <button
              onClick={() => generateMut.mutate({ targetRole })}
              disabled={generateMut.isPending || !targetRole.trim()}
              className="btn-primary w-full gap-2"
            >
              {generateMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generateMut.isPending ? 'Generating…' : 'Generate Roadmap'}
            </button>
          </div>
          <p className="text-xs text-navy-400">Requires an analyzed resume. Upload and analyze first if you haven't.</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-navy-900">Progress toward <span className="text-primary-600">{roadmap.targetRole}</span></p>
                <p className="text-sm text-navy-400 mt-0.5">{done} of {tasks.length} tasks complete</p>
              </div>
              <div className="text-right">
                <span className={clsx('text-2xl font-display font-bold', progress >= 75 ? 'text-emerald-600' : progress >= 40 ? 'text-amber-600' : 'text-primary-600')}>
                  {progress}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Skill gaps */}
          {roadmap.skillGaps?.length > 0 && (
            <div className="card card-body">
              <h2 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-500" /> Identified Skill Gaps
              </h2>
              <div className="flex flex-wrap gap-2">
                {roadmap.skillGaps.map((s, i) => (
                  <span key={i} className="badge-amber">{typeof s === 'string' ? s : (s.skill || '')}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {['skill', 'project', 'interview'].map((type) => {
            const typeTasks = tasks.filter(t => t.type === type)
            if (!typeTasks.length) return null
            const Icon  = TASK_TYPES[type]
            const label = type === 'skill' ? 'Skills to Learn' : type === 'project' ? 'Portfolio Projects' : 'Interview Prep'
            return (
              <div key={type} className="card card-body space-y-2">
                <h2 className="font-semibold text-navy-900 flex items-center gap-2 mb-1">
                  <Icon size={16} className="text-primary-500" /> {label}
                </h2>
                {typeTasks.map((task) => (
                  <TaskItem
                    key={task._id || task.id}
                    task={task}
                    onToggle={() => taskMut.mutate({ id: task._id || task.id, data: { completed: !task.completed } })}
                    isPending={taskMut.isPending}
                  />
                ))}
              </div>
            )
          })}

          <div className="alert-info text-xs">
            <p>AI-generated recommendations are suggestions, not guaranteed outcomes. Verify resources before enrolling. Roadmap updates as you provide feedback.</p>
          </div>
        </>
      )}
    </div>
  )
}

function TaskItem({ task, onToggle, isPending }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={clsx('border rounded-xl p-3 transition-all', task.completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-surface-200 bg-surface-0')}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} disabled={isPending} className="flex-shrink-0 mt-0.5" aria-label="Toggle task">
          {task.completed
            ? <CheckCircle size={18} className="text-emerald-500" />
            : <Circle size={18} className="text-navy-300 hover:text-primary-400 transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium leading-snug', task.completed && 'line-through text-navy-400')}>
            {task.title}
          </p>
          {task.estimatedTime && (
            <span className="text-[11px] text-navy-400 flex items-center gap-1 mt-0.5">
              <Clock size={10} /> {task.estimatedTime}
            </span>
          )}
        </div>
        {task.description && (
          <button onClick={() => setExpanded(!expanded)} className="btn-ghost btn-sm p-1 flex-shrink-0">
            <ChevronDown size={14} className={clsx('text-navy-400 transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>
      {expanded && task.description && (
        <div className="mt-2 ml-7 text-xs text-navy-500 leading-relaxed animate-slide-down">
          {task.description}
          {task.resourceUrl && (
            <a href={task.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline ml-1 font-medium">
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
