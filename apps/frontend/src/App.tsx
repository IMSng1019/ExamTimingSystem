import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Plus, Save, Trash2, Upload, X } from "lucide-react";
import {
  calculateBellTarget,
  createBellTriggerKey,
  DEFAULT_TEXTS,
  formatClock,
  formatDisplayDateTime,
  fromDateTimeInputValue,
  getExamStatus,
  getMergedSchedule,
  getRemainingText,
  getSelectedSubjects,
  SUBJECT_OPTIONS,
  toDateTimeInputValue,
  type AudioFileInfo,
  type BellAnchor,
  type BellDirection,
  type BellRule,
  type DisplayTexts,
  type ExamConfig
} from "@exam-countdown/shared";
import { getAudioFiles, getAudioUrl, getConfig, saveConfig } from "./api";
import { collectBellAudioUrls, syncPreloadedAudio } from "./audio-preload";

type Notice = {
  kind: "ok" | "error";
  text: string;
} | null;

const textFields: Array<[keyof DisplayTexts, string]> = [
  ["title", "标题"],
  ["subjectLabel", "科目字段"],
  ["startLabel", "开考字段"],
  ["endLabel", "结束字段"],
  ["readyStatus", "准备状态"],
  ["runningStatus", "进行中状态"],
  ["endedStatus", "结束状态"],
  ["beforeStartPrefix", "开始前提示"],
  ["beforeEndPrefix", "结束前提示"],
  ["afterEndText", "结束后提示"],
  ["footerLeft", "底部左侧"],
  ["footerRight", "底部右侧"]
];

function makeRule(): BellRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "自定义响铃",
    enabled: true,
    anchor: "start",
    direction: "before",
    offsetSeconds: 60,
    audioFile: ""
  };
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function playDefaultBell() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const playTone = (frequency: number, start: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, context.currentTime + start);
    gain.gain.linearRampToValueAtTime(0.28, context.currentTime + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + start + 0.55);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + 0.6);
  };

  playTone(880, 0);
  playTone(660, 0.7);
}

export function App() {
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFileInfo[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const triggeredRules = useRef(new Set<string>());
  const audioCache = useRef(new Map<string, HTMLAudioElement>());

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch((error: unknown) => {
        setNotice({
          kind: "error",
          text: error instanceof Error ? error.message : "读取配置失败"
        });
      });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen((open) => !open);
        setSubjectPickerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!config?.audioDirectory) {
      setAudioFiles([]);
      return;
    }

    getAudioFiles(config.audioDirectory)
      .then(setAudioFiles)
      .catch(() => setAudioFiles([]));
  }, [config?.audioDirectory]);

  useEffect(() => {
    if (!config) {
      audioCache.current.clear();
      return;
    }

    const urls = collectBellAudioUrls(config, getAudioUrl);
    syncPreloadedAudio(audioCache.current, urls, (url) => {
      const audio = new Audio(url);
      audio.addEventListener(
        "error",
        () => {
          audioCache.current.delete(url);
        },
        { once: true }
      );
      return audio;
    });
  }, [config]);

  const schedule = useMemo(() => (config ? getMergedSchedule(config) : null), [config]);
  const selectedSubjects = useMemo(() => (config ? getSelectedSubjects(config) : []), [config]);
  const status = useMemo(() => (config ? getExamStatus(config, now) : null), [config, now]);
  const remainingText = useMemo(() => (config ? getRemainingText(config, now) : ""), [config, now]);

  const triggerResetKey = useMemo(() => {
    if (!config) {
      return "";
    }

    return JSON.stringify({
      selectedSubjectKeys: config.selectedSubjectKeys,
      subjects: config.subjects.map((subject) => [subject.key, subject.startTime, subject.endTime]),
      bellRules: config.bellRules.map((rule) => [rule.id, rule.anchor, rule.direction, rule.offsetSeconds, rule.audioFile, rule.enabled])
    });
  }, [config]);

  useEffect(() => {
    triggeredRules.current.clear();
  }, [triggerResetKey]);

  const persistConfig = useCallback(async (nextConfig: ExamConfig, successMessage?: string) => {
    setConfig(nextConfig);
    try {
      const saved = await saveConfig(nextConfig);
      setConfig(saved);
      if (successMessage) {
        setNotice({
          kind: "ok",
          text: successMessage
        });
      }
    } catch (error: unknown) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "保存配置失败"
      });
    }
  }, []);

  const updateConfig = useCallback(
    (updater: (current: ExamConfig) => ExamConfig, successMessage?: string) => {
      if (!config) {
        return;
      }

      void persistConfig(updater(config), successMessage);
    },
    [config, persistConfig]
  );

  const playRule = useCallback(
    (rule: BellRule) => {
      if (config?.audioDirectory && rule.audioFile) {
        const url = getAudioUrl(config.audioDirectory, rule.audioFile);
        const audio = audioCache.current.get(url) ?? new Audio(url);
        try {
          audio.currentTime = 0;
        } catch {
          // Some formats do not allow seeking until metadata is available.
        }
        audio.play().catch(playDefaultBell);
        return;
      }

      playDefaultBell();
    },
    [config?.audioDirectory]
  );

  useEffect(() => {
    if (!config || !schedule) {
      return;
    }

    for (const rule of config.bellRules) {
      if (!rule.enabled) {
        continue;
      }

      const target = calculateBellTarget(schedule, rule);
      const key = createBellTriggerKey(schedule, rule);
      if (!target || !key || triggeredRules.current.has(key)) {
        continue;
      }

      const delta = now.getTime() - target.getTime();
      if (delta >= 0 && delta < 1500) {
        triggeredRules.current.add(key);
        window.setTimeout(() => playRule(rule), 0);
      }
    }
  }, [config, now, playRule, schedule]);

  const exportConfig = async () => {
    if (!config) {
      return;
    }

    const result = await window.examBridge?.saveConfigFile(config);
    if (result && !result.canceled) {
      setNotice({
        kind: "ok",
        text: "配置已保存"
      });
    }
  };

  const importConfig = async () => {
    const result = await window.examBridge?.openConfigFile();
    if (!result || result.canceled || !result.config) {
      return;
    }

    await persistConfig(result.config, "配置已读取");
  };

  const selectAudioDirectory = async () => {
    const directory = await window.examBridge?.selectAudioDirectory();
    if (!directory) {
      return;
    }

    updateConfig(
      (current) => ({
        ...current,
        audioDirectory: directory
      }),
      "音频文件夹已设置"
    );
  };

  if (!config || !status) {
    return (
      <main className="screen">
        <div className="loading">正在加载...</div>
      </main>
    );
  }

  const subjectText = selectedSubjects.map((subject) => subject.label).join("、");

  return (
    <main className="screen">
      <section className="display">
        <h1>{config.texts.title}</h1>

        <div className="meta">
          <button className="subject-line" type="button" onClick={() => setSubjectPickerOpen((open) => !open)}>
            <span>{config.texts.subjectLabel}：</span>
            <strong>{subjectText}</strong>
            <em>{status.label}</em>
          </button>
          <div>
            <span>{config.texts.startLabel}：</span>
            <strong>{schedule ? formatDisplayDateTime(schedule.startTime) : ""}</strong>
          </div>
          <div>
            <span>{config.texts.endLabel}：</span>
            <strong>{schedule ? formatDisplayDateTime(schedule.endTime) : ""}</strong>
          </div>
        </div>

        {subjectPickerOpen && (
          <SubjectPicker config={config} updateConfig={updateConfig} close={() => setSubjectPickerOpen(false)} />
        )}

        <div className="divider" />
        <div className="clock">{formatClock(now)}</div>
        <div className="remaining-divider" />
        <div className="remaining">{remainingText}</div>
        <footer>
          <span>{config.texts.footerLeft}</span>
          <span>{config.texts.footerRight}</span>
        </footer>
      </section>

      {notice && (
        <div className={`notice ${notice.kind}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="关闭提示">
            <X size={16} />
          </button>
        </div>
      )}

      {settingsOpen && (
        <SettingsPanel
          audioFiles={audioFiles}
          config={config}
          exportConfig={exportConfig}
          importConfig={importConfig}
          selectAudioDirectory={selectAudioDirectory}
          setSettingsOpen={setSettingsOpen}
          updateConfig={updateConfig}
        />
      )}
    </main>
  );
}

function SubjectPicker({
  close,
  config,
  updateConfig
}: {
  close: () => void;
  config: ExamConfig;
  updateConfig: (updater: (current: ExamConfig) => ExamConfig, successMessage?: string) => void;
}) {
  const toggleSubject = (key: string) => {
    updateConfig((current) => {
      const hasKey = current.selectedSubjectKeys.includes(key);
      const nextKeys = hasKey
        ? current.selectedSubjectKeys.filter((item) => item !== key)
        : [...current.selectedSubjectKeys, key];

      return {
        ...current,
        selectedSubjectKeys: nextKeys.length > 0 ? nextKeys : [key]
      };
    });
  };

  return (
    <div className="subject-popover">
      <div className="subject-grid">
        {SUBJECT_OPTIONS.map(([key, label]) => (
          <label key={key}>
            <input checked={config.selectedSubjectKeys.includes(key)} type="checkbox" onChange={() => toggleSubject(key)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <button type="button" onClick={close}>
        确定
      </button>
    </div>
  );
}

function SettingsPanel({
  audioFiles,
  config,
  exportConfig,
  importConfig,
  selectAudioDirectory,
  setSettingsOpen,
  updateConfig
}: {
  audioFiles: AudioFileInfo[];
  config: ExamConfig;
  exportConfig: () => Promise<void>;
  importConfig: () => Promise<void>;
  selectAudioDirectory: () => Promise<void>;
  setSettingsOpen: (open: boolean) => void;
  updateConfig: (updater: (current: ExamConfig) => ExamConfig, successMessage?: string) => void;
}) {
  const updateText = (key: keyof DisplayTexts, value: string) => {
    updateConfig((current) => ({
      ...current,
      texts: {
        ...current.texts,
        [key]: value
      }
    }));
  };

  const updateSubjectTime = (key: string, field: "startTime" | "endTime", value: string) => {
    updateConfig((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.key === key
          ? {
              ...subject,
              [field]: fromDateTimeInputValue(value)
            }
          : subject
      )
    }));
  };

  const updateRule = (id: string, patch: Partial<BellRule>) => {
    updateConfig((current) => ({
      ...current,
      bellRules: current.bellRules.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              ...patch
            }
          : rule
      )
    }));
  };

  const deleteRule = (id: string) => {
    updateConfig((current) => ({
      ...current,
      bellRules: current.bellRules.filter((rule) => rule.id !== id)
    }));
  };

  const addRule = () => {
    updateConfig((current) => ({
      ...current,
      bellRules: [...current.bellRules, makeRule()]
    }));
  };

  return (
    <div className="settings-overlay">
      <aside className="settings-panel" aria-label="设置">
        <header className="settings-header">
          <h2>设置</h2>
          <div>
            <button className="icon-button" type="button" onClick={importConfig} title="读取配置">
              <Upload size={18} />
            </button>
            <button className="icon-button" type="button" onClick={exportConfig} title="保存配置">
              <Save size={18} />
            </button>
            <button className="icon-button" type="button" onClick={() => setSettingsOpen(false)} title="关闭">
              <X size={18} />
            </button>
          </div>
        </header>

        <section>
          <h3>页面文字</h3>
          <div className="form-grid">
            {textFields.map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input value={config.texts[key]} onChange={(event) => updateText(key, event.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>科目时间</h3>
          <div className="schedule-list">
            {config.subjects.map((subject) => (
              <div className="schedule-row" key={subject.key}>
                <strong>{subject.label}</strong>
                <label>
                  <span>开始</span>
                  <input
                    type="datetime-local"
                    value={toDateTimeInputValue(subject.startTime)}
                    onChange={(event) => updateSubjectTime(subject.key, "startTime", event.target.value)}
                  />
                </label>
                <label>
                  <span>结束</span>
                  <input
                    type="datetime-local"
                    value={toDateTimeInputValue(subject.endTime)}
                    onChange={(event) => updateSubjectTime(subject.key, "endTime", event.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>当前科目</h3>
          <div className="subject-checkboxes">
            {SUBJECT_OPTIONS.map(([key, label]) => (
              <label key={key}>
                <input
                  checked={config.selectedSubjectKeys.includes(key)}
                  type="checkbox"
                  onChange={() => {
                    updateConfig((current) => {
                      const selected = current.selectedSubjectKeys.includes(key)
                        ? current.selectedSubjectKeys.filter((item) => item !== key)
                        : [...current.selectedSubjectKeys, key];
                      return {
                        ...current,
                        selectedSubjectKeys: selected.length > 0 ? selected : [key]
                      };
                    });
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>音频文件夹</h3>
          <div className="folder-row">
            <input readOnly value={config.audioDirectory || "未选择"} />
            <button type="button" onClick={selectAudioDirectory}>
              <FolderOpen size={17} />
              <span>选择</span>
            </button>
          </div>
          <p>{audioFiles.length > 0 ? `已识别 ${audioFiles.length} 个音频文件` : "未识别到音频文件"}</p>
        </section>

        <section>
          <div className="section-heading">
            <h3>响铃规则</h3>
            <button type="button" onClick={addRule}>
              <Plus size={17} />
              <span>添加</span>
            </button>
          </div>

          <div className="rule-list">
            {config.bellRules.map((rule) => (
              <div className="rule-row" key={rule.id}>
                <label className="rule-enabled">
                  <input checked={rule.enabled} type="checkbox" onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })} />
                  <span>启用</span>
                </label>
                <input value={rule.name} onChange={(event) => updateRule(rule.id, { name: event.target.value })} />
                <select value={rule.anchor} onChange={(event) => updateRule(rule.id, { anchor: event.target.value as BellAnchor })}>
                  <option value="start">考试开始</option>
                  <option value="end">考试结束</option>
                </select>
                <select value={rule.direction} onChange={(event) => updateRule(rule.id, { direction: event.target.value as BellDirection })}>
                  <option value="before">前</option>
                  <option value="after">后</option>
                </select>
                <label>
                  <span>分钟</span>
                  <input
                    min={0}
                    step={1}
                    type="number"
                    value={Math.round(rule.offsetSeconds / 60)}
                    onChange={(event) => updateRule(rule.id, { offsetSeconds: Number(event.target.value || 0) * 60 })}
                  />
                </label>
                <select value={rule.audioFile} onChange={(event) => updateRule(rule.id, { audioFile: event.target.value })}>
                  <option value="">默认铃声</option>
                  {audioFiles.map((file) => (
                    <option key={file.name} value={file.name}>
                      {file.name} ({formatFileSize(file.size)})
                    </option>
                  ))}
                </select>
                <button className="icon-button danger" type="button" onClick={() => deleteRule(rule.id)} title="删除">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
