export interface RunButton {
	cwd?: string
	command: string
	vsCommand: string
	singleInstance?: boolean
	name: string
	color: string
	// 安静模式：不打开面板
	silent?: boolean
	// 每次运行是否清除屏幕，默认为 true，如果 singleInstance 设置为 true，则该字段无效
	clear?: boolean
}
