import { registerDecorator } from 'class-validator';

export function IsEndTimeAfterStartTime(startField: string, validationOptions?: any) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsEndTimeAfterStartTime',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startField],
      validator: {
        validate(endAt: string, args: any) {
          const [startFieldName] = args.constraints;
          const startAt = (args.object as any)[startFieldName];

          if (!startAt || !endAt) return true;

          const toMinutes = (time: string): number => {
            const [h, m] = time.split(':').map(Number);
            // Treat "24:00" as 1440 minutes
            return h === 24 ? 1440 : h * 60 + m;
          };

          const start = toMinutes(startAt);
          const end = toMinutes(endAt);

          return end > start || end < start; // allow overnight shifts
        },

        defaultMessage(args: any) {
          return `${args.property} must be later than ${args.constraints[0]} (24:00 allowed as midnight)`;
        },
      },
    });
  };
}
