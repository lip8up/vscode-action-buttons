import { RunButton, NpmCommandsConfig } from './types'
import { workspace } from 'vscode'
import * as fs from 'fs'

export async function getNpmScriptCommands(defaultColor: string, config: NpmCommandsConfig[]): Promise<RunButton[]> {
  const list: RunButton[] = []
  const cwd = workspace.rootPath

  if (cwd == null || cwd == '') {
    return list
  }

  try {
    // 从 package.json 中读取
    const jsonFile = `${cwd}/package.json`
    const json = getJson(jsonFile)
    if (json != null) {
      const { scripts } = json

      const configMap = config.reduce((map, item) => {
        map[item.name] = item
        return map
      }, {} as { [key: string]: NpmCommandsConfig })

      const useYarn = fs.existsSync(`${cwd}/yarn.lock`)
      const packageManager = useYarn ? 'yarn' : 'npm'
      const color = defaultColor || 'white'

      // console.log(config, configMap)

      const commands = Object.keys(scripts).reduce((list, key) => {
        const cfg = configMap[key] || { name: key, singleInstance: true }
        if (!cfg.ignore) {
          list.push({
            name: key,
            command: `${packageManager} run ${key}`,
            singleInstance: cfg.singleInstance != null ? cfg.singleInstance : true,
            color: cfg.color != null ? cfg.color : color,
            silent: cfg.silent != null ? cfg.silent : false,
            clear: cfg.clear != null ? cfg.clear : true,
          })
        }
        return list
      }, [] as RunButton[])

      list.push(...commands)
    }
  } catch (ex) {
    console.error(`package.json parse error`, ex)
  }

  return list
}

export async function getDevConfigCommands(defaultColor: string): Promise<RunButton[]> {
  const list: RunButton[] = []
  const cwd = workspace.rootPath

  if (cwd == null || cwd == '') {
    return list
  }

  try {
    const jsonFile = `${cwd}/.dev/actionButtons.json`
    const commands = getJson(jsonFile)
    // console.log(jsonFile, commands)
    if (commands != null) {
      if (Array.isArray(commands)) {
        const color = defaultColor || 'white'
        list.push(...commands.map(it => ({ color, ...it })))
      }
    }
  } catch (ex) {
    console.error(`actionButtons parse error`, ex)
  }

  return list
}

// 使用 require(jsonFile) 的方式，有缓存，只能读取一次，不能动态获取更新
export function getJson(jsonFile: string) {
  try {
    if (fs.existsSync(jsonFile)) {
      const content = fs.readFileSync(jsonFile, { encoding: 'utf-8' })
      return JSON.parse(content)
    }
  } catch (ex) {
    console.error('getJson error', ex)
  }
}
