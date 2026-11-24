import { FormTextField } from "@/components/settings/FormTextField";
import { SettingsActionList } from "@/components/settings/SettingsActionList";
import { defaultDayName, moveItem } from "@/core/logic/routineEditor";
import {
  Button,
  ContextMenu,
  HStack,
  LabeledContent,
  Menu,
  Section,
  SwipeActions,
  Text,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  foregroundStyle,
  labelStyle,
  layoutPriority,
  menuIndicator,
  menuStyle,
} from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useMemo } from "react";

export type RoutineEditorExercise = { key: string; id?: string; exerciseId: string };

export type RoutineEditorDay = {
  key: string;
  id?: string;
  name: string;
  exercises: RoutineEditorExercise[];
};

type CatalogExercise = { id: string; name: string };

type RoutineFormBodyProps = {
  name: string;
  onNameChange: (value: string) => void;
  days: RoutineEditorDay[];
  onDaysChange: (update: (days: RoutineEditorDay[]) => RoutineEditorDay[]) => void;
  availableExercises: CatalogExercise[];
  /** Space for a control floating over the top of the list. */
  topInset?: number;
};

const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });
const menuMods = [
  menuStyle("button" as const),
  buttonStyle("plain" as const),
  menuIndicator("hidden" as const),
  labelStyle("iconOnly" as const),
  secondary,
];

let nextKey = 0;
function localKey() {
  nextKey += 1;
  return `local-${nextKey}`;
}

export function RoutineFormBody({
  name,
  onNameChange,
  days,
  onDaysChange,
  availableExercises,
  topInset = 0,
}: RoutineFormBodyProps) {
  const router = useRouter();
  const names = useMemo(
    () => new Map(availableExercises.map((exercise) => [exercise.id, exercise.name])),
    [availableExercises],
  );

  return (
    <SettingsActionList topInset={topInset} dismissKeyboardOnScroll>
      <Section>
        <FormTextField label="Name" initial={name} placeholder="Routine" onChange={onNameChange} />
      </Section>
      {days.map((day, index) => (
        <Section key={day.key}>
          <LabeledContent label="Day">
            <HStack alignment="center" spacing={8}>
              <FormTextField
                initial={day.name}
                placeholder="Name"
                onChange={(value) =>
                  onDaysChange((current) =>
                    current.map((item) => (item.key === day.key ? { ...item, name: value } : item)),
                  )
                }
                modifiers={[layoutPriority(1)]}
              />
              <DayMenu
                name={day.name}
                canMoveUp={index > 0}
                canMoveDown={index < days.length - 1}
                onMoveUp={() => onDaysChange((current) => moveItem(current, index, -1))}
                onMoveDown={() => onDaysChange((current) => moveItem(current, index, 1))}
                onDelete={() => onDaysChange((current) => current.filter((item) => item.key !== day.key))}
              />
            </HStack>
          </LabeledContent>
          {day.exercises.map((exercise, exerciseIndex) => (
            <ExerciseRow
              key={exercise.key}
              name={names.get(exercise.exerciseId) ?? "Unknown exercise"}
              canMoveUp={exerciseIndex > 0}
              canMoveDown={exerciseIndex < day.exercises.length - 1}
              onMoveUp={() =>
                onDaysChange((current) =>
                  current.map((item) =>
                    item.key === day.key
                      ? { ...item, exercises: moveItem(item.exercises, exerciseIndex, -1) }
                      : item,
                  ),
                )
              }
              onMoveDown={() =>
                onDaysChange((current) =>
                  current.map((item) =>
                    item.key === day.key
                      ? { ...item, exercises: moveItem(item.exercises, exerciseIndex, 1) }
                      : item,
                  ),
                )
              }
              onDelete={() =>
                onDaysChange((current) =>
                  current.map((item) =>
                    item.key === day.key
                      ? {
                          ...item,
                          exercises: item.exercises.filter((row) => row.key !== exercise.key),
                        }
                      : item,
                  ),
                )
              }
            />
          ))}
          <Button
            label="Add exercise"
            onPress={() =>
              router.push({
                pathname: "/settings/routines/add-exercise",
                params: { dayKey: day.key },
              })
            }
          />
        </Section>
      ))}
      <Section>
        <Button
          label="Add day"
          onPress={() =>
            onDaysChange((current) => [
              ...current,
              { key: localKey(), name: defaultDayName(current.length), exercises: [] },
            ])
          }
        />
      </Section>
    </SettingsActionList>
  );
}

function DayMenu({
  name,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  name: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu label={name || "Day options"} systemImage="ellipsis" modifiers={menuMods}>
      {canMoveUp ? <Button label="Move up" systemImage="arrow.up" onPress={onMoveUp} /> : null}
      {canMoveDown ? <Button label="Move down" systemImage="arrow.down" onPress={onMoveDown} /> : null}
      <Button label="Delete" systemImage="trash" role="destructive" onPress={onDelete} />
    </Menu>
  );
}

function ExerciseRow({
  name,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  name: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <SwipeActions>
      <ContextMenu>
        <ContextMenu.Trigger>
          <Text>{name}</Text>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          {canMoveUp ? <Button label="Move up" systemImage="arrow.up" onPress={onMoveUp} /> : null}
          {canMoveDown ? <Button label="Move down" systemImage="arrow.down" onPress={onMoveDown} /> : null}
          <Button label="Delete" systemImage="trash" role="destructive" onPress={onDelete} />
        </ContextMenu.Items>
      </ContextMenu>
      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
        <Button
          label="Delete"
          systemImage="trash"
          role="destructive"
          modifiers={[labelStyle("iconOnly")]}
          onPress={onDelete}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}
