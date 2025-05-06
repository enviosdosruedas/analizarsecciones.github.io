
import os
import sys

# Set default encoding to UTF-8
# This might be necessary if running in environments where the default encoding isn't UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')


def get_directory_structure_and_content(startpath, output_file):
    """
    Walks through a directory, records its structure and the content
    of all files found, and writes it to an output file.

    Args:
        startpath (str): The path to the directory to scan.
        output_file (str): The path to the file where the output will be saved.
    """

    # Define the file to skip
    file_to_skip = "/home/user/studio/src/app/favicon.ico"

    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.write(f"Scanning directory: {startpath}\n")
            outfile.write("=" * 40 + "\n\n")

            for root, dirs, files in os.walk(startpath):
                # Adjust path display relative to the starting directory if desired,
                # or keep the full path for clarity.
                relative_path = os.path.relpath(root, os.path.dirname(startpath))
                level = relative_path.count(os.sep)
                indent = ' ' * 4 * level

                # Print directory structure
                outfile.write(f"{indent}Directory: {os.path.basename(root)}/\n")
                subindent = ' ' * 4 * (level + 1)

                # Process files in the current directory
                for file in files:
                    file_path = os.path.join(root, file)

                    if file_path != file_to_skip:
                        outfile.write(f"{subindent}File: {file}\n")
                        outfile.write(f"{subindent}--- START OF CONTENT ---\n")
                        try:
                            # Read file content
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                                content = infile.read()
                                # Indent each line of the content for readability in the output file
                                indented_content = '\n'.join([f"{subindent}{line}" for line in content.splitlines()])
                                outfile.write(indented_content + '\n')
                        except Exception as e:
                            outfile.write(f"{subindent}Error reading file {file_path}: {e}\n")
                        outfile.write(f"{subindent}--- END OF CONTENT ---\n\n")

            outfile.write("=" * 40 + "\n")
            outfile.write("Scan complete.\n")
        print(f"Successfully scanned '{startpath}' and saved structure and content to '{output_file}'")
    except Exception as e:
        print(f"An error occurred: {e}")

# Define the target directory and the output file
target_directory = '/home/user/studio/src/app'
output_txt_file = '/home/user/studio/app_structure_and_content.txt' # Output in the project root

# Ensure the target directory exists
if not os.path.isdir(target_directory):
    print(f"Error: The directory '{target_directory}' does not exist.")
else:
    # Run the function
    get_directory_structure_and_content(target_directory, output_txt_file)
