// Every rule id the preset configures, including the ones only overrides mention.
export async function collectRuleIds(config)
{
	const preset = config ?? (await import('../index.js')).default;
	const ids = new Set(Object.keys(preset.rules ?? {}));
	for (const override of preset.overrides ?? [])
	{
		for (const id of Object.keys(override.rules ?? {}))
		{
			ids.add(id);
		}
	}

	return ids;
}
